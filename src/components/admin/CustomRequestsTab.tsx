'use client';

// src/components/admin/CustomRequestsTab.tsx
// Management panel for listing customer custom commissions and inquiries

import React, { useState, useEffect } from 'react';
import {
  adminGetCustomRequestsAction,
  adminUpdateCustomRequestStatusAction,
  adminDeleteCustomRequestAction
} from '@/app/actions/admin';
import { CustomRequest, CustomRequestStatus, UserRole } from '@/types/database.types';

interface ProfileData {
  id: string;
  email: string | undefined;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

interface CustomRequestsTabProps {
  profile: ProfileData;
}

export default function CustomRequestsTab({ profile }: CustomRequestsTabProps) {
  const [requests, setRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CustomRequestStatus | 'all'>('all');
  const [selectedRequest, setSelectedRequest] = useState<CustomRequest | null>(null);
  
  // Edit form states
  const [updating, setUpdating] = useState(false);
  const [formStatus, setFormStatus] = useState<CustomRequestStatus>('new');
  const [formNotes, setFormNotes] = useState('');

  const isEditor = false; // Deprecated role
  const isReadOnly = false; // Deprecated role
  const isOwner = profile.role === 'owner' || profile.role === 'admin';

  const fetchRequests = async () => {
    if (isEditor) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const filterStatus = statusFilter === 'all' ? undefined : statusFilter;
    const result = await adminGetCustomRequestsAction(filterStatus);
    if (result.success) {
      setRequests(result.data);
    } else {
      alert(`Failed to load custom requests: ${result.error}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleOpenDetails = (req: CustomRequest) => {
    setSelectedRequest(req);
    setFormStatus(req.status);
    setFormNotes(req.admin_notes || '');
  };

  const handleUpdateStatusAndNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || isReadOnly) return;
    setUpdating(true);

    const result = await adminUpdateCustomRequestStatusAction(
      selectedRequest.id,
      formStatus,
      formNotes
    );

    if (result.success) {
      setRequests(requests.map(r => r.id === selectedRequest.id ? { ...r, status: formStatus, admin_notes: formNotes } : r));
      setSelectedRequest(null);
    } else {
      alert(`Failed to update request: ${result.error}`);
    }
    setUpdating(false);
  };

  const handleDeleteRequest = async (id: string) => {
    if (!isOwner) return;
    if (!confirm('Are you sure you want to delete this custom inquiry? This action cannot be undone.')) return;

    const result = await adminDeleteCustomRequestAction(id);
    if (result.success) {
      setRequests(requests.filter(r => r.id !== id));
      setSelectedRequest(null);
    } else {
      alert(`Failed to delete request: ${result.error}`);
    }
  };

  const getStatusBadge = (status: CustomRequestStatus) => {
    const styles: Record<CustomRequestStatus, string> = {
      new: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
      contacted: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500',
      quoted: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
      accepted: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
      rejected: 'bg-red-500/10 border-red-500/30 text-red-400',
      completed: 'bg-zinc-800 border-zinc-700 text-zinc-400'
    };
    return (
      <span className={`px-2 py-1 text-[10px] font-bold tracking-wide uppercase rounded-md border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  // Content Editors do not have DB policy access to custom requests
  if (isEditor) {
    return (
      <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4 animate-fadeIn mt-10">
        <div className="w-12 h-12 bg-red-950/30 border border-red-900/30 text-red-400 rounded-full flex items-center justify-center mx-auto text-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-base font-serif text-amber-200">Access Restricted</h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Content Editors are restricted from viewing customer commission logs and phone lines due to security rules. If you need access, please contact the Store Owner.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-serif text-amber-100">Custom Commission Inquiries</h2>
        <p className="text-xs text-zinc-400 mt-1">Review custom artwork requests, budget quotes, and admin follow-up history.</p>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 p-4 border border-zinc-850 rounded-2xl flex flex-wrap gap-3 items-center">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mr-2">Filter by Status:</span>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          All Requests
        </button>
        {(['new', 'contacted', 'quoted', 'accepted', 'rejected', 'completed'] as CustomRequestStatus[]).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer capitalize ${
              statusFilter === status
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-zinc-400 font-sans">Syncing commissions queue...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-12 text-center text-zinc-500 text-sm">
          No custom requests found in this status queue.
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-850 rounded-2xl overflow-hidden shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400 font-medium text-xs uppercase tracking-wider">
                  <th className="py-4 px-6">Customer Details</th>
                  <th className="py-4 px-6">Inquiry Date</th>
                  <th className="py-4 px-6">Bespoke Type</th>
                  <th className="py-4 px-6">Est. Budget</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-zinc-850/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-zinc-200">{r.customer_name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">{r.customer_phone}</div>
                    </td>
                    <td className="py-4 px-6 text-zinc-400">
                      {new Date(r.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-4 px-6 text-zinc-300 font-medium capitalize">
                      {r.request_type ? r.request_type.replace(/_/g, ' ') : <span className="text-zinc-600 italic">Unspecified</span>}
                    </td>
                    <td className="py-4 px-6 text-amber-300 font-semibold font-sans">
                      {r.estimated_budget ? `₹${Number(r.estimated_budget).toLocaleString('en-IN')}` : <span className="text-zinc-600 font-normal italic">None</span>}
                    </td>
                    <td className="py-4 px-6">{getStatusBadge(r.status)}</td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => handleOpenDetails(r)}
                        className="px-3.5 py-1.5 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900 text-xs font-semibold text-amber-400 rounded-lg cursor-pointer transition-all"
                      >
                        Inspect Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Inspections Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 bg-zinc-950 border-b border-zinc-850">
              <div>
                <h3 className="text-lg font-serif text-amber-200">
                  Custom Request Details
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">Customer description, reference media files, and follow-up status tracking</p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-1 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg cursor-pointer outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateStatusAndNotes} className="p-6 overflow-y-auto space-y-6 flex-grow">
              {/* Customer Contact Details */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-950 p-4 border border-zinc-850 rounded-xl text-sm">
                <div>
                  <div className="text-zinc-500 text-xs">Customer Name</div>
                  <div className="font-semibold text-zinc-200 mt-1">{selectedRequest.customer_name}</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-xs">WhatsApp Link</div>
                  <div className="font-semibold text-zinc-200 mt-1">
                    <a
                      href={`https://wa.me/${selectedRequest.customer_phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-amber-400 hover:underline flex items-center gap-1.5"
                    >
                      {selectedRequest.customer_phone}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
                {selectedRequest.customer_email && (
                  <div className="col-span-2">
                    <div className="text-zinc-500 text-xs">Email Address</div>
                    <div className="font-semibold text-zinc-200 mt-0.5">{selectedRequest.customer_email}</div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Commission Brief Description</span>
                <p className="bg-zinc-950 p-4 border border-zinc-850 text-sm text-zinc-300 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {selectedRequest.description}
                </p>
              </div>

              {/* Reference Images */}
              {selectedRequest.reference_image_urls && selectedRequest.reference_image_urls.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Reference Design Uploads</span>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedRequest.reference_image_urls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video bg-zinc-950 rounded-xl overflow-hidden border border-zinc-850 hover:border-zinc-700 transition-colors group relative"
                      >
                        <img src={url} alt={`ref-${idx}`} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as any).src = 'https://placehold.co/300x200?text=Preview+Unavailable'; }} />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-xs font-semibold text-white transition-opacity">
                          View Original Image
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom specs */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-zinc-950 p-4 border border-zinc-850 rounded-xl">
                <div>
                  <span className="text-zinc-500 font-bold uppercase block mb-1">Commission Type</span>
                  <span className="text-zinc-300 text-sm font-semibold capitalize">{selectedRequest.request_type ? selectedRequest.request_type.replace(/_/g, ' ') : 'Not Specified'}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-bold uppercase block mb-1">Estimated Budget</span>
                  <span className="text-amber-400 text-sm font-sans font-bold">{selectedRequest.estimated_budget ? `₹${Number(selectedRequest.estimated_budget).toLocaleString('en-IN')}` : 'No Budget Quoted'}</span>
                </div>
              </div>

              {/* Action Updates */}
              <div className="border-t border-zinc-850 pt-5 space-y-4">
                <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Follow-Up Workflow Updates</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Request Status</label>
                    <select
                      disabled={isReadOnly}
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as CustomRequestStatus)}
                      className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none focus:border-amber-500 disabled:opacity-50"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="quoted">Quoted / Priced</option>
                      <option value="accepted">Accepted (Paid Deposit)</option>
                      <option value="rejected">Rejected / Cancelled</option>
                      <option value="completed">Completed / Dispatched</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[8px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Internal Administration Notes</label>
                    <textarea
                      disabled={isReadOnly}
                      rows={3}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Add quote details, sizes agreed on, delivery timelines discussed..."
                      className="w-full bg-zinc-950 border border-zinc-850 focus:border-amber-500 rounded-xl px-3.5 py-2 text-sm text-zinc-100 outline-none resize-none font-sans"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Actions Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-850 flex items-center justify-between">
              <div>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleDeleteRequest(selectedRequest.id)}
                    className="px-4 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-xs font-semibold rounded-xl text-red-400 cursor-pointer transition-all"
                  >
                    Delete Inquiry
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-semibold rounded-xl text-zinc-300 cursor-pointer"
                >
                  Close
                </button>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleUpdateStatusAndNotes}
                    disabled={updating}
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-xs font-bold text-zinc-950 rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    {updating ? 'Saving...' : 'Update Inquiry'}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
