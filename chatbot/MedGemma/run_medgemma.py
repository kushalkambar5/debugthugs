import os
os.environ["TQDM_DISABLE"] = "1"
import io
import time
import json
import uuid
import base64
import torch
import asyncio
import requests
from PIL import Image
from typing import List, Optional, Union, Dict, Any
from contextlib import asynccontextmanager
from threading import Thread

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field, ConfigDict
from transformers import (
    AutoProcessor,
    AutoModelForImageTextToText,
    BitsAndBytesConfig,
    TextIteratorStreamer,
)

# ============================================================
# CONFIG
# ============================================================

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(SCRIPT_DIR, "model")

processor = None
model = None


# ============================================================
# LOAD MODEL
# ============================================================

def load_model():
    global processor, model

    print("=" * 60)
    print("MEDGEMMA LOCAL OPENAI-COMPATIBLE API SERVER")
    print("=" * 60)

    if not torch.cuda.is_available():
        raise RuntimeError("CUDA is not available.")

    print("GPU:", torch.cuda.get_device_name(0))

    total_vram = (
        torch.cuda.get_device_properties(0).total_memory / 1024**3
    )

    print(f"VRAM: {total_vram:.2f} GB")
    print(f"Model path: {MODEL_PATH}")

    # --------------------------------------------------------
    # 4-bit quantization
    # --------------------------------------------------------

    quantization_config = BitsAndBytesConfig(
        load_in_4bit=True,
        bnb_4bit_quant_type="nf4",
        bnb_4bit_compute_dtype=torch.bfloat16,
    )

    # --------------------------------------------------------
    # Processor
    # --------------------------------------------------------

    print("\nLoading processor...")

    processor = AutoProcessor.from_pretrained(
        MODEL_PATH,
        local_files_only=True,
    )

    print("Processor loaded.")

    # --------------------------------------------------------
    # Model
    # --------------------------------------------------------

    print("\nLoading MedGemma in 4-bit...")
    torch.cuda.empty_cache()

    model = AutoModelForImageTextToText.from_pretrained(
        MODEL_PATH,
        quantization_config=quantization_config,
        device_map="auto",
        use_safetensors=False,
        low_cpu_mem_usage=True,
        local_files_only=True,
    )

    model.eval()

    print("\nMedGemma loaded successfully!")

    allocated = torch.cuda.memory_allocated() / 1024**3
    reserved = torch.cuda.memory_reserved() / 1024**3

    print(f"GPU allocated: {allocated:.2f} GB")
    print(f"GPU reserved:  {reserved:.2f} GB")


# ============================================================
# FASTAPI LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    print("\nShutting down MedGemma server...")


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="MedGemma OpenAI API",
    description="Local MedGemma 1.5 4B OpenAI Compatible Server",
    version="1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST & RESPONSE MODELS
# ============================================================

class ChatRequest(BaseModel):
    message: str
    max_new_tokens: int = 300


class OpenAIMessage(BaseModel):
    role: str
    content: Union[str, List[Dict[str, Any]], List[Any]]


class OpenAIChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    model: Optional[str] = "MedGemma 1.5 4B"
    messages: List[OpenAIMessage]
    max_tokens: Optional[int] = Field(default=512, alias="max_new_tokens")
    temperature: Optional[float] = 0.7
    stream: Optional[bool] = False


# ============================================================
# HEALTH & MODEL ENDPOINTS
# ============================================================

@app.get("/")
def root():
    return {
        "status": "running",
        "model": "MedGemma 1.5 4B IT",
        "device": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "cuda": torch.cuda.is_available(),
        "model_loaded": model is not None,
    }


@app.get("/v1/models")
@app.get("/models")
def list_models():
    return {
        "object": "list",
        "data": [
            {
                "id": "MedGemma 1.5 4B",
                "object": "model",
                "created": int(time.time()),
                "owned_by": "local",
            }
        ],
    }


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def load_image(source: Any) -> Optional[Image.Image]:
    if isinstance(source, Image.Image):
        return source.convert("RGB")
    if not isinstance(source, str):
        return None

    try:
        if source.startswith("data:image"):
            base64_data = source.split(",", 1)[1]
            image_bytes = base64.b64decode(base64_data)
            return Image.open(io.BytesIO(image_bytes)).convert("RGB")
        elif source.startswith("http://") or source.startswith("https://"):
            resp = requests.get(source, timeout=15)
            resp.raise_for_status()
            return Image.open(io.BytesIO(resp.content)).convert("RGB")
        elif os.path.exists(source):
            return Image.open(source).convert("RGB")
        else:
            image_bytes = base64.b64decode(source)
            return Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception as e:
        print(f"[MedGemma] Error loading image: {e}")
        return None


def format_openai_messages(messages: List[OpenAIMessage]):
    formatted = []
    for msg in messages:
        role = msg.role if msg.role in ["user", "assistant", "system"] else "user"

        if isinstance(msg.content, str):
            formatted.append({
                "role": role,
                "content": [{"type": "text", "text": msg.content}]
            })
        elif isinstance(msg.content, list):
            content_items = []
            for part in msg.content:
                if isinstance(part, str):
                    if part.strip():
                        content_items.append({"type": "text", "text": part})
                elif isinstance(part, dict):
                    part_type = part.get("type", "")
                    if part_type == "text":
                        text_val = part.get("text", "")
                        if text_val:
                            content_items.append({"type": "text", "text": text_val})
                    elif part_type in ["image_url", "image"]:
                        url_val = None
                        if "image_url" in part:
                            img_obj = part["image_url"]
                            if isinstance(img_obj, dict):
                                url_val = img_obj.get("url")
                            elif isinstance(img_obj, str):
                                url_val = img_obj
                        elif "image" in part:
                            img_obj = part["image"]
                            if isinstance(img_obj, dict):
                                url_val = img_obj.get("url")
                            elif isinstance(img_obj, str):
                                url_val = img_obj
                        elif "url" in part:
                            url_val = part.get("url")

                        if url_val:
                            img = load_image(url_val)
                            if img:
                                content_items.append({"type": "image", "image": img})

            if content_items:
                formatted.append({
                    "role": role,
                    "content": content_items
                })
    return formatted


def clean_thinking_output(text: str) -> str:
    """
    Formats MedGemma thinking tags (<unused94>thought ... <unused95>)
    into standard markdown <think> ... </think> tags for LibreChat / UI.
    """
    if "<unused94>thought" in text:
        text = text.replace("<unused94>thought", "<think>")
    elif "<unused94>" in text:
        text = text.replace("<unused94>", "<think>")

    if "<unused95>" in text:
        text = text.replace("<unused95>", "\n</think>\n\n")

    if "<think>" in text and "</think>" not in text:
        text = text + "\n</think>\n\n"

    return text


class StreamingThinkingProcessor:
    """
    Transforms stream tokens on the fly, replacing MedGemma thinking tags
    with <think> ... </think> tags for clean UI display.
    """
    def __init__(self):
        self.buffer = ""
        self.in_think = False

    def process(self, chunk: str) -> str:
        self.buffer += chunk
        out = ""

        while self.buffer:
            if not self.in_think:
                if "<unused94>thought" in self.buffer:
                    idx = self.buffer.find("<unused94>thought")
                    out += self.buffer[:idx] + "<think>\n"
                    self.buffer = self.buffer[idx + len("<unused94>thought"):]
                    self.in_think = True
                elif "<unused94>" in self.buffer:
                    idx = self.buffer.find("<unused94>")
                    out += self.buffer[:idx] + "<think>\n"
                    self.buffer = self.buffer[idx + len("<unused94>"):]
                    self.in_think = True
                else:
                    break
            else:
                if "<unused95>" in self.buffer:
                    idx = self.buffer.find("<unused95>")
                    out += self.buffer[:idx] + "\n</think>\n\n"
                    self.buffer = self.buffer[idx + len("<unused95>"):]
                    self.in_think = False
                else:
                    break

        max_tag_len = 17
        if len(self.buffer) > max_tag_len:
            safe_len = len(self.buffer) - max_tag_len
            out += self.buffer[:safe_len]
            self.buffer = self.buffer[safe_len:]

        return out

    def flush(self) -> str:
        out = self.buffer
        self.buffer = ""
        if self.in_think:
            out += "\n</think>\n\n"
            self.in_think = False
        return out


# ============================================================
# CHAT ENDPOINTS
# ============================================================

@app.post("/chat")
def chat(request: ChatRequest):
    if model is None or processor is None:
        raise HTTPException(status_code=503, detail="Model is not loaded.")
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    try:
        messages = [
            {
                "role": "user",
                "content": [{"type": "text", "text": request.message}],
            }
        ]
        inputs = processor.apply_chat_template(
            messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        )
        inputs = {
            key: value.to(model.device) if hasattr(value, "to") else value
            for key, value in inputs.items()
        }

        with torch.inference_mode():
            output = model.generate(
                **inputs,
                max_new_tokens=request.max_new_tokens,
                do_sample=False,
            )

        generated_tokens = output[0][inputs["input_ids"].shape[-1]:]
        response = processor.decode(generated_tokens, skip_special_tokens=True)
        response = clean_thinking_output(response)

        return {"response": response, "model": "MedGemma 1.5 4B IT"}

    except torch.cuda.OutOfMemoryError:
        torch.cuda.empty_cache()
        raise HTTPException(status_code=507, detail="GPU ran out of memory.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/v1/chat/completions")
@app.post("/chat/completions")
async def chat_completions(request: OpenAIChatRequest):
    if model is None or processor is None:
        raise HTTPException(status_code=503, detail="Model is not loaded.")
    if not request.messages:
        raise HTTPException(status_code=400, detail="Messages list cannot be empty.")

    formatted_messages = format_openai_messages(request.messages)
    
    try:
        inputs = processor.apply_chat_template(
            formatted_messages,
            add_generation_prompt=True,
            tokenize=True,
            return_dict=True,
            return_tensors="pt",
        )
        inputs = {
            key: value.to(model.device) if hasattr(value, "to") else value
            for key, value in inputs.items()
        }

        max_tokens = request.max_tokens or 512
        chat_id = f"chatcmpl-{uuid.uuid4().hex[:12]}"
        created_time = int(time.time())
        model_name = request.model or "MedGemma 1.5 4B"

        if request.stream:
            streamer = TextIteratorStreamer(
                processor.tokenizer,
                skip_prompt=True,
                skip_special_tokens=True,
            )
            generation_kwargs = dict(
                **inputs,
                streamer=streamer,
                max_new_tokens=max_tokens,
                do_sample=request.temperature > 0 if request.temperature is not None else False,
            )
            if request.temperature and request.temperature > 0:
                generation_kwargs["temperature"] = request.temperature

            thread = Thread(target=model.generate, kwargs=generation_kwargs)
            thread.start()

            async def generate_stream():
                think_processor = StreamingThinkingProcessor()
                for new_text in streamer:
                    if not new_text:
                        continue
                    transformed = think_processor.process(new_text)
                    if transformed:
                        chunk = {
                            "id": chat_id,
                            "object": "chat.completion.chunk",
                            "created": created_time,
                            "model": model_name,
                            "choices": [
                                {
                                    "index": 0,
                                    "delta": {"content": transformed},
                                    "finish_reason": None,
                                }
                            ],
                        }
                        yield f"data: {json.dumps(chunk)}\n\n"
                        await asyncio.sleep(0.001)

                flushed = think_processor.flush()
                if flushed:
                    chunk = {
                        "id": chat_id,
                        "object": "chat.completion.chunk",
                        "created": created_time,
                        "model": model_name,
                        "choices": [
                            {
                                "index": 0,
                                "delta": {"content": flushed},
                                "finish_reason": None,
                            }
                        ],
                    }
                    yield f"data: {json.dumps(chunk)}\n\n"
                    await asyncio.sleep(0.001)

                final_chunk = {
                    "id": chat_id,
                    "object": "chat.completion.chunk",
                    "created": created_time,
                    "model": model_name,
                    "choices": [
                        {
                            "index": 0,
                            "delta": {},
                            "finish_reason": "stop",
                        }
                    ],
                }
                yield f"data: {json.dumps(final_chunk)}\n\n"
                yield "data: [DONE]\n\n"

            return StreamingResponse(generate_stream(), media_type="text/event-stream")

        else:
            with torch.inference_mode():
                output = model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    do_sample=request.temperature > 0 if request.temperature is not None else False,
                )

            input_len = inputs["input_ids"].shape[-1]
            generated_tokens = output[0][input_len:]
            response_text = processor.decode(generated_tokens, skip_special_tokens=True)
            response_text = clean_thinking_output(response_text)

            return {
                "id": chat_id,
                "object": "chat.completion",
                "created": created_time,
                "model": model_name,
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": response_text,
                        },
                        "finish_reason": "stop",
                    }
                ],
                "usage": {
                    "prompt_tokens": int(input_len),
                    "completion_tokens": int(len(generated_tokens)),
                    "total_tokens": int(input_len + len(generated_tokens)),
                },
            }

    except torch.cuda.OutOfMemoryError:
        torch.cuda.empty_cache()
        raise HTTPException(status_code=507, detail="GPU ran out of memory.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":
    load_model()
    import uvicorn
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8001,
    )