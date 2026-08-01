"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/MaterialIcon";

interface Scan {
  id: string;
  scanType: string;
  predictionResult: any;
  status: string;
  aiExplanation: string;
  createdAt: string;
  completedAt: string;
}

interface Metric {
  id: string;
  steps: number;
  heartRateAvg: number;
  caloriesBurnt: string;
  spo2Percentage: string;
  sleepDurationMinutes: number;
  metricDate: string;
}

interface Report {
  id: string;
  title: string;
  reportType: string;
  fileUrl: string;
  reportDate: string;
}

interface Patient {
  id: string;
  fullName: string;
  email: string;
  dateOfBirth: string | null;
  gender: string | null;
  bloodGroup: string | null;
  heightCm: string | null;
  weightKg: string | null;
  allergiesJson: string | null;
  chronicConditionsJson: string | null;
  currentMedicationsJson: string | null;
  emergencyContactPhone: string | null;
  profileImageUrl: string | null;
  assignedDoctorId: string | null;
  assignedAt: string | null;
  assignmentStatus: string | null;
  scans: Scan[];
  metrics: Metric[];
  reports: Report[];
}

export default function PatientsDashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctorProfileId, setDoctorProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch("/api/doctor/patients");
      if (!resp.ok) {
        throw new Error("Failed to retrieve patients records.");
      }
      const data = await resp.json();
      setPatients(data.patients || []);
      setDoctorProfileId(data.doctorProfileId || null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while loading patient records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  // Filter patients based on search
  const filteredPatients = patients.filter((p) => {
    return (
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Active Patients Title */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#787363] font-sans">
            My Assigned Patients ({patients.length})
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#787363]">
            <MaterialIcon name="search" className="text-lg" />
          </span>
          <input
            type="text"
            placeholder="Search patient by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#DCD5C5] rounded-xl text-[#1C1B18] placeholder-[#A8A28E] focus:outline-hidden focus:ring-2 focus:ring-[#8C6B1F]/30 focus:border-[#8C6B1F] text-xs font-semibold font-sans"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 bg-[#FAF9F5] border border-[#E6E1D3] rounded-[32px]">
          <svg className="animate-spin h-8 w-8 text-[#8C6B1F]" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs text-[#787363] font-sans">Loading clinical database...</span>
        </div>
      ) : error ? (
        <div className="bg-[#FAF0E6] border border-[#F2C5B0] text-[#8C2E0B] p-6 rounded-[32px] text-center">
          <MaterialIcon name="error" className="text-3xl text-[#B34515] mb-2" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={fetchPatients}
            className="mt-3 px-4 py-2 bg-[#B34515] text-white text-xs font-semibold rounded-lg hover:bg-[#8C2E0B] transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : filteredPatients.length === 0 ? (
        <div className="py-16 text-center border border-[#E6E1D3] rounded-[32px] bg-white text-[#787363]">
          <MaterialIcon name="person_off" className="text-4xl text-[#DCD5C5] mb-2" />
          <p className="text-xs font-semibold">No patient records found matching the active filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          
          {/* Patients list table column */}
          <div className="xl:col-span-2 bg-white border border-[#E6E1D3] rounded-[32px] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#FAF6E8] text-xs font-sans">
                <thead className="bg-[#FAF9F5] text-[#4D493E]">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">Patient Name</th>
                    <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">Clinical Specs</th>
                    <th className="px-6 py-4 text-left font-bold uppercase tracking-wider">Care Link</th>
                    <th className="px-6 py-4 text-right font-bold uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FAF6E8] bg-white text-[#1C1B18]">
                  {filteredPatients.map((p) => {
                    const isAssignedToMe = p.assignedDoctorId === doctorProfileId && p.assignmentStatus === "ACTIVE";

                    return (
                      <tr
                        key={p.id}
                        className={`hover:bg-[#FAF6E8]/30 transition-colors ${
                          selectedPatientId === p.id ? "bg-[#FAF6E8]/40" : ""
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[#FAF6E8] border shrink-0">
                              <img
                                src={p.profileImageUrl || "/avatars/avatar1.svg"}
                                alt="avatar"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <div className="font-bold text-[#1C1B18]">{p.fullName}</div>
                              <div className="text-[10px] text-[#787363]">{p.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="block text-[10px] font-semibold text-[#4D493E]">
                              {p.gender || "Unspecified"} • {p.dateOfBirth ? `${p.dateOfBirth}` : "No DOB"}
                            </span>
                            <span className="inline-block bg-[#FAF6E8] border border-[#E6E1D3] text-[9px] font-bold text-[#8C6B1F] px-1.5 py-0.2 rounded">
                              Blood Group: {p.bloodGroup || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isAssignedToMe ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full uppercase">
                              <span className="w-1 h-1 rounded-full bg-emerald-500" />
                              My Patient
                            </span>
                          ) : p.assignedDoctorId ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#787363] bg-[#FAF6E8] border px-2.5 py-0.5 rounded-full uppercase">
                              Linked Elsewhere
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#B34515] bg-[#FAF0E6] border border-[#F2C5B0] px-2.5 py-0.5 rounded-full uppercase">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                          <button
                            onClick={() => setSelectedPatientId(p.id)}
                            className="px-3 py-1.5 bg-[#FAF6E8] text-[#8C6B1F] hover:bg-[#8C6B1F] hover:text-white rounded-lg font-bold transition-all text-[10px] uppercase cursor-pointer"
                          >
                            Clinical View
                          </button>
                          
                          {/* Doctor cannot choose/assign/release patients directly */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right sidebar patient detail panel */}
          <div className="xl:col-span-1">
            {selectedPatient ? (
              <div className="bg-[#FAF9F5] border border-[#E6E1D3] rounded-[32px] p-6 space-y-6 shadow-2xs">
                
                {/* Header */}
                <div className="flex items-start justify-between border-b border-[#E6E1D3] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#FAF6E8] border shrink-0">
                      <img
                        src={selectedPatient.profileImageUrl || "/avatars/avatar1.svg"}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-serif text-lg font-bold text-[#1C1B18]">
                        {selectedPatient.fullName}
                      </h4>
                      <p className="text-[10px] text-[#787363] font-sans">{selectedPatient.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPatientId(null)}
                    className="p-1.5 text-[#787363] hover:text-[#1C1B18] hover:bg-[#FAF6E8] rounded-full transition-colors cursor-pointer"
                  >
                    <MaterialIcon name="close" className="text-lg" />
                  </button>
                </div>

                {/* Biometrics list grid */}
                <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                  <div className="bg-white p-3 rounded-xl border border-[#E6E1D3]/50">
                    <span className="block text-[9px] text-[#787363] uppercase font-bold mb-0.5">Blood Group</span>
                    <span className="font-bold text-[#1C1B18]">{selectedPatient.bloodGroup || "N/A"}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E6E1D3]/50">
                    <span className="block text-[9px] text-[#787363] uppercase font-bold mb-0.5">Gender</span>
                    <span className="font-bold text-[#1C1B18]">{selectedPatient.gender || "N/A"}</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E6E1D3]/50">
                    <span className="block text-[9px] text-[#787363] uppercase font-bold mb-0.5">Height</span>
                    <span className="font-bold text-[#1C1B18]">
                      {selectedPatient.heightCm ? `${selectedPatient.heightCm} cm` : "N/A"}
                    </span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-[#E6E1D3]/50">
                    <span className="block text-[9px] text-[#787363] uppercase font-bold mb-0.5">Weight</span>
                    <span className="font-bold text-[#1C1B18]">
                      {selectedPatient.weightKg ? `${selectedPatient.weightKg} kg` : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Chronic Conditions & Allergies */}
                <div className="space-y-3 font-sans text-xs">
                  <div>
                    <span className="block text-[10px] font-bold text-[#4D493E] uppercase tracking-wider mb-1">
                      Chronic Conditions
                    </span>
                    <div className="p-3 bg-white border border-[#E6E1D3]/50 rounded-xl leading-relaxed text-[#1C1B18]">
                      {selectedPatient.chronicConditionsJson || "None documented."}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-[#4D493E] uppercase tracking-wider mb-1">
                      Allergies & Sensitivities
                    </span>
                    <div className="p-3 bg-white border border-[#E6E1D3]/50 rounded-xl leading-relaxed text-[#1C1B18]">
                      {selectedPatient.allergiesJson || "None documented."}
                    </div>
                  </div>

                  <div>
                    <span className="block text-[10px] font-bold text-[#4D493E] uppercase tracking-wider mb-1">
                      Current Medications
                    </span>
                    <div className="p-3 bg-white border border-[#E6E1D3]/50 rounded-xl leading-relaxed text-[#1C1B18]">
                      {selectedPatient.currentMedicationsJson || "None documented."}
                    </div>
                  </div>
                </div>

                {/* Recent Disease Scans */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-[#4D493E] uppercase tracking-wider font-sans">
                    Recent AI Disease Scans ({selectedPatient.scans.length})
                  </span>
                  {selectedPatient.scans.length === 0 ? (
                    <p className="text-[11px] text-[#787363] font-sans italic pl-1">No AI scans saved for this patient.</p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                      {selectedPatient.scans.map((scan) => (
                        <div
                          key={scan.id}
                          className="bg-white p-2.5 rounded-xl border border-[#E6E1D3]/50 text-xs font-sans flex items-start justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="block font-bold text-[#1C1B18] uppercase tracking-wide text-[10px]">
                              {scan.scanType.replace("_", " ")}
                            </span>
                            <span className="block text-[9px] text-[#787363]">
                              Uploaded: {new Date(scan.createdAt).toLocaleDateString()}
                            </span>
                            {scan.predictionResult && (
                              <span className="block text-[10px] text-[#8C6B1F] font-semibold mt-1">
                                Diagnosis: {scan.predictionResult.diagnosis || scan.predictionResult.diagnosis_result || (scan.predictionResult.tumor_found ? "Tumor Found" : "Negative")}
                              </span>
                            )}
                          </div>
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-[8px] font-bold border border-emerald-100 uppercase uppercase shrink-0">
                            {scan.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Health Metrics Summary */}
                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-[#4D493E] uppercase tracking-wider font-sans">
                    Recent Health Connect Syncs ({selectedPatient.metrics.length})
                  </span>
                  {selectedPatient.metrics.length === 0 ? (
                    <p className="text-[11px] text-[#787363] font-sans italic pl-1">No synced biometric logs.</p>
                  ) : (
                    <div className="space-y-2 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                      {selectedPatient.metrics.slice(0, 3).map((metric) => (
                        <div
                          key={metric.id}
                          className="bg-white p-2.5 rounded-xl border border-[#E6E1D3]/50 text-xs font-sans space-y-1.5"
                        >
                          <div className="flex justify-between text-[9px] text-[#787363] font-bold">
                            <span>SYNC DATE: {metric.metricDate}</span>
                            <span className="text-emerald-600">HEALTH_CONNECT</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                            <div className="bg-[#FAF6E8] p-1.5 rounded">
                              <span className="block text-[8px] text-[#787363]">STEPS</span>
                              <span className="font-bold text-[#1C1B18]">{metric.steps || "—"}</span>
                            </div>
                            <div className="bg-[#FAF6E8] p-1.5 rounded">
                              <span className="block text-[8px] text-[#787363]">HEART (AVG)</span>
                              <span className="font-bold text-[#1C1B18]">{metric.heartRateAvg ? `${metric.heartRateAvg} bpm` : "—"}</span>
                            </div>
                            <div className="bg-[#FAF6E8] p-1.5 rounded">
                              <span className="block text-[8px] text-[#787363]">SPO2</span>
                              <span className="font-bold text-[#1C1B18]">{metric.spo2Percentage ? `${metric.spo2Percentage}%` : "—"}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Open Chat Action */}
                <div className="pt-2 border-t border-[#E6E1D3]">
                  <button
                    onClick={() => router.push(`/chat?patientId=${selectedPatient.id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#EAF3FB] hover:bg-[#C8DEF5]/60 border border-[#1C5396]/20 hover:border-[#1C5396]/40 text-[#1C5396] rounded-2xl text-xs font-bold uppercase tracking-wide transition-all cursor-pointer shadow-xs"
                  >
                    <MaterialIcon name="forum" className="text-base" />
                    <span>Open Clinical Chat</span>
                  </button>
                </div>

              </div>
            ) : (
              <div className="h-full border border-dashed border-[#DCD5C5] rounded-[32px] p-8 flex flex-col items-center justify-center text-center bg-white/40 text-[#787363] min-h-[400px]">
                <MaterialIcon name="manage_accounts" className="text-4xl text-[#DCD5C5] mb-2" />
                <h4 className="font-serif font-bold text-[#1C1B18] mb-1">No Patient Selected</h4>
                <p className="text-xs font-sans max-w-[200px] leading-relaxed">
                  Click the &quot;Clinical View&quot; button of any patient record to display their historical biometrics and logs here.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
