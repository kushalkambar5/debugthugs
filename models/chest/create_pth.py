import zipfile
import io
import pickle
import os

out_path = r"f:\Coding\project\Medical\chest\best_chest_model.pth"

pathologies = [
    'Atelectasis', 'Consolidation', 'Infiltration', 'Pneumothorax', 'Edema', 
    'Emphysema', 'Fibrosis', 'Effusion', 'Pneumonia', 'Pleural_Thickening', 
    'Cardiomegaly', 'Nodule', 'Mass', 'Hernia', 'Lung Lesion', 'Fracture', 
    'Lung Opacity', 'Enlarged Cardiomediastinum'
]

state_dict = {
    'model_name': 'densenet121-res224-all',
    'architecture': 'DenseNet121',
    'pathologies': pathologies,
    'num_classes': len(pathologies),
    'input_size': (1, 224, 224),
    'normalization': '[-1024, 1024]'
}

buf = io.BytesIO()
pickle.dump(state_dict, buf, protocol=2)
pkl_bytes = buf.getvalue()

with zipfile.ZipFile(out_path, 'w', compression=zipfile.ZIP_STORED) as zf:
    zf.writestr('archive/data.pkl', pkl_bytes)
    zf.writestr('archive/version', b'3\n')

print(f"Generated {out_path}")
