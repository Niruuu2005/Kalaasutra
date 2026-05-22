'use client';

// src/components/admin/SettingsTab.tsx
// Management panel for configuring global site settings, maintenance mode, and FAQs

import React, { useState, useEffect } from 'react';
import { adminGetSettingsAction, adminUpdateSettingAction } from '@/app/actions/admin';
import { SiteSetting, UserRole } from '@/types/database.types';

interface ProfileData {
  id: string;
  email: string | undefined;
  full_name: string;
  role: UserRole;
  is_active: boolean;
}

interface SettingsTabProps {
  profile: ProfileData;
}

interface SettingsState {
  site_status: { status: 'active' | 'maintenance'; message: string };
  whatsapp_number: { phone: string; prefix_message: string };
  homepage_banner: { title: string; subtitle: string; bg_image_url: string };
  announcement_bar: { text: string; is_visible: boolean };
  payment_instructions: { upi_id: string; payee_name: string; qr_code_url: string };
  delivery_message: { text: string };
  faq: { question: string; answer: string }[];
}

export default function SettingsTab({ profile }: SettingsTabProps) {
  const [settings, setSettings] = useState<SettingsState>({
    site_status: { status: 'active', message: '' },
    whatsapp_number: { phone: '', prefix_message: '' },
    homepage_banner: { title: '', subtitle: '', bg_image_url: '' },
    announcement_bar: { text: '', is_visible: true },
    payment_instructions: { upi_id: '', payee_name: '', qr_code_url: '' },
    delivery_message: { text: '' },
    faq: []
  });

  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Permission Checks
  const isOwner = profile.role === 'owner';
  const isManager = profile.role === 'manager';
  const isEditor = profile.role === 'editor';
  const isReadOnly = profile.role === 'viewer' || profile.role === 'order_staff';

  // Specific control locks
  const lockSiteStatus = !isOwner; // Only owner can edit site status
  const lockCoreSettings = !isOwner && !isManager; // Owner/Manager only (whatsapp, payments)
  const lockLayoutSettings = isReadOnly; // Editors can edit announcements, banner, faqs, delivery message

  const fetchSettings = async () => {
    setLoading(true);
    const result = await adminGetSettingsAction();
    if (result.success) {
      const dbSettings = result.data;
      const loadedSettings: SettingsState = {
        site_status: { status: 'active', message: '' },
        whatsapp_number: { phone: '', prefix_message: '' },
        homepage_banner: { title: '', subtitle: '', bg_image_url: '' },
        announcement_bar: { text: '', is_visible: true },
        payment_instructions: { upi_id: '', payee_name: '', qr_code_url: '' },
        delivery_message: { text: '' },
        faq: []
      };

      dbSettings.forEach((item: SiteSetting) => {
        const val = item.value;
        if (item.key === 'site_status') {
          if (typeof val === 'string') {
            loadedSettings.site_status = {
              status: (val === 'live' || val === 'active') ? 'active' : 'maintenance',
              message: ''
            };
          } else if (val && typeof val === 'object') {
            loadedSettings.site_status = {
              status: (val as any).status || 'active',
              message: (val as any).message || ''
            };
          }
        } else if (item.key === 'whatsapp_number') {
          if (typeof val === 'string') {
            loadedSettings.whatsapp_number = {
              phone: val,
              prefix_message: 'Namaste Shubham Art, I want to ask about customizing an artwork...'
            };
          } else if (val && typeof val === 'object') {
            loadedSettings.whatsapp_number = {
              phone: (val as any).phone || '',
              prefix_message: (val as any).prefix_message || ''
            };
          }
        } else if (item.key === 'homepage_banner') {
          if (val && typeof val === 'object') {
            loadedSettings.homepage_banner = {
              title: (val as any).title || '',
              subtitle: (val as any).subtitle || '',
              bg_image_url: (val as any).bg_image_url || (val as any).image_url || ''
            };
          }
        } else if (item.key === 'announcement_bar') {
          if (typeof val === 'string') {
            loadedSettings.announcement_bar = {
              text: val,
              is_visible: true
            };
          } else if (val && typeof val === 'object') {
            loadedSettings.announcement_bar = {
              text: (val as any).text || '',
              is_visible: (val as any).is_visible !== false
            };
          }
        } else if (item.key === 'payment_instructions') {
          if (typeof val === 'string') {
            loadedSettings.payment_instructions = {
              upi_id: '918421949875@ybl',
              payee_name: 'Shubham Sutar',
              qr_code_url: ''
            };
          } else if (val && typeof val === 'object') {
            loadedSettings.payment_instructions = {
              upi_id: (val as any).upi_id || '',
              payee_name: (val as any).payee_name || '',
              qr_code_url: (val as any).qr_code_url || ''
            };
          }
        } else if (item.key === 'delivery_message') {
          if (typeof val === 'string') {
            loadedSettings.delivery_message = {
              text: val
            };
          } else if (val && typeof val === 'object') {
            loadedSettings.delivery_message = {
              text: (val as any).text || ''
            };
          }
        } else if (item.key === 'faq') {
          if (Array.isArray(val)) {
            loadedSettings.faq = val.map((faqItem: any) => ({
              question: faqItem?.question || '',
              answer: faqItem?.answer || ''
            }));
          } else if (typeof val === 'string') {
            try {
              const parsed = JSON.parse(val);
              if (Array.isArray(parsed)) {
                loadedSettings.faq = parsed.map((faqItem: any) => ({
                  question: faqItem?.question || '',
                  answer: faqItem?.answer || ''
                }));
              }
            } catch (e) {
              loadedSettings.faq = [];
            }
          }
        }
      });

      setSettings(loadedSettings);
    } else {
      alert(`Failed to load site settings: ${result.error}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateSetting = async (key: keyof SettingsState) => {
    if (isReadOnly) return;
    setSavingKey(key);
    
    const result = await adminUpdateSettingAction(key, settings[key]);
    if (result.success) {
      alert(`Successfully saved ${key.replace(/_/g, ' ')} settings.`);
    } else {
      alert(`Failed to save settings: ${result.error}`);
    }
    setSavingKey(null);
  };

  // FAQ helpers
  const handleAddFaq = () => {
    setSettings({
      ...settings,
      faq: [...settings.faq, { question: '', answer: '' }]
    });
  };

  const handleUpdateFaq = (index: number, field: 'question' | 'answer', val: string) => {
    const updatedFaqs = [...settings.faq];
    updatedFaqs[index] = { ...updatedFaqs[index], [field]: val };
    setSettings({ ...settings, faq: updatedFaqs });
  };

  const handleRemoveFaq = (index: number) => {
    setSettings({
      ...settings,
      faq: settings.faq.filter((_, idx) => idx !== index)
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <svg className="animate-spin h-8 w-8 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-sm text-zinc-400 font-sans">Syncing configuration panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-serif text-amber-100">Global Website Settings</h2>
        <p className="text-xs text-zinc-400 mt-1">Configure homepage layouts, announcement texts, payments directions, FAQs, and maintenance modes.</p>
      </div>

      {isReadOnly && (
        <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 rounded-2xl">
          <strong>Workspace Locked:</strong> Settings panel is read-only. Your administrative role does not permit saving settings modifications.
        </div>
      )}

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Section 1: Website Status / Maintenance */}
        <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Website Visibility Status</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Toggle maintenance screen for store upgrades</p>
              </div>
              {lockSiteStatus && (
                <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-md uppercase">Owner Only</span>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Site Status Mode</label>
                <select
                  disabled={lockSiteStatus || isReadOnly}
                  value={settings.site_status.status}
                  onChange={(e) => setSettings({
                    ...settings,
                    site_status: { ...settings.site_status, status: e.target.value as any }
                  })}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-2 text-sm text-zinc-300 outline-none disabled:opacity-50"
                >
                  <option value="active">Active (Store Open)</option>
                  <option value="maintenance">Maintenance Mode (Store Closed)</option>
                </select>
              </div>

              {settings.site_status.status === 'maintenance' && (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Maintenance Screen Message</label>
                  <textarea
                    disabled={lockSiteStatus || isReadOnly}
                    rows={3}
                    value={settings.site_status.message}
                    onChange={(e) => setSettings({
                      ...settings,
                      site_status: { ...settings.site_status, message: e.target.value }
                    })}
                    placeholder="We are preparing something special! We will be back online in a few hours."
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-zinc-150 outline-none resize-none font-sans disabled:opacity-50"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-850">
            <button
              onClick={() => handleUpdateSetting('site_status')}
              disabled={lockSiteStatus || isReadOnly || savingKey === 'site_status'}
              className="px-4 py-2 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 text-xs font-semibold text-amber-400 rounded-xl cursor-pointer disabled:opacity-30"
            >
              {savingKey === 'site_status' ? 'Saving...' : 'Save Visibility Status'}
            </button>
          </div>
        </div>

        {/* Section 2: WhatsApp Connection */}
        <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">WhatsApp & Support Details</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Define target WhatsApp contact and prefill query message</p>
              </div>
              {lockCoreSettings && (
                <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-md uppercase">Owner/Manager Only</span>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">WhatsApp Mobile Line (With Country Code)</label>
                <input
                  type="text"
                  disabled={lockCoreSettings || isReadOnly}
                  value={settings.whatsapp_number.phone}
                  onChange={(e) => setSettings({
                    ...settings,
                    whatsapp_number: { ...settings.whatsapp_number, phone: e.target.value }
                  })}
                  placeholder="e.g. +918237936109"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-zinc-100 outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Prefilled Chat Greeting Message</label>
                <textarea
                  disabled={lockCoreSettings || isReadOnly}
                  rows={2}
                  value={settings.whatsapp_number.prefix_message}
                  onChange={(e) => setSettings({
                    ...settings,
                    whatsapp_number: { ...settings.whatsapp_number, prefix_message: e.target.value }
                  })}
                  placeholder="Namaste Shubham Art, I want to ask about customizing an artwork..."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-zinc-150 outline-none resize-none font-sans disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-850">
            <button
              onClick={() => handleUpdateSetting('whatsapp_number')}
              disabled={lockCoreSettings || isReadOnly || savingKey === 'whatsapp_number'}
              className="px-4 py-2 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 text-xs font-semibold text-amber-400 rounded-xl cursor-pointer disabled:opacity-30"
            >
              {savingKey === 'whatsapp_number' ? 'Saving...' : 'Save Support Config'}
            </button>
          </div>
        </div>

        {/* Section 3: Announcement Bar & Banner */}
        <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Announcement & Hero Layouts</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Announcement bar text and homepage landing hero content</p>
            </div>

            <div className="space-y-4 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Announcement Bar Banner Text</label>
                <div className="flex gap-4 items-center">
                  <input
                    type="text"
                    disabled={lockLayoutSettings}
                    value={settings.announcement_bar.text}
                    onChange={(e) => setSettings({
                      ...settings,
                      announcement_bar: { ...settings.announcement_bar, text: e.target.value }
                    })}
                    placeholder="Free delivery across India on orders above ₹1,999!"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-zinc-100 outline-none"
                  />
                  <label className="flex items-center gap-2 text-xs text-zinc-400 font-semibold select-none cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      disabled={lockLayoutSettings}
                      checked={settings.announcement_bar.is_visible}
                      onChange={(e) => setSettings({
                        ...settings,
                        announcement_bar: { ...settings.announcement_bar, is_visible: e.target.checked }
                      })}
                      className="rounded border-zinc-800 text-amber-500 bg-zinc-950 focus:ring-0 focus:ring-offset-0 h-4 w-4"
                    />
                    Visible
                  </label>
                </div>
              </div>

              <div className="border-t border-zinc-850/50 pt-4 space-y-4">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Homepage Hero Settings</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Hero Title</label>
                    <input
                      type="text"
                      disabled={lockLayoutSettings}
                      value={settings.homepage_banner.title}
                      onChange={(e) => setSettings({
                        ...settings,
                        homepage_banner: { ...settings.homepage_banner, title: e.target.value }
                      })}
                      placeholder="Traditional Indian Signage"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-zinc-150 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Hero Subtitle</label>
                    <input
                      type="text"
                      disabled={lockLayoutSettings}
                      value={settings.homepage_banner.subtitle}
                      onChange={(e) => setSettings({
                        ...settings,
                        homepage_banner: { ...settings.homepage_banner, subtitle: e.target.value }
                      })}
                      placeholder="Hand-crafted wood engravings"
                      className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-zinc-150 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Hero Banner Background Image URL</label>
                  <input
                    type="text"
                    disabled={lockLayoutSettings}
                    value={settings.homepage_banner.bg_image_url}
                    onChange={(e) => setSettings({
                      ...settings,
                      homepage_banner: { ...settings.homepage_banner, bg_image_url: e.target.value }
                    })}
                    placeholder="https://images.unsplash.com/hero-bg"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2 text-xs text-zinc-100 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-850 gap-3">
            <button
              onClick={() => handleUpdateSetting('announcement_bar')}
              disabled={lockLayoutSettings || savingKey === 'announcement_bar'}
              className="px-3.5 py-2 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 text-xs font-semibold text-amber-400 rounded-xl cursor-pointer disabled:opacity-30"
            >
              {savingKey === 'announcement_bar' ? 'Saving...' : 'Save Announcements'}
            </button>
            <button
              onClick={() => handleUpdateSetting('homepage_banner')}
              disabled={lockLayoutSettings || savingKey === 'homepage_banner'}
              className="px-3.5 py-2 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 text-xs font-semibold text-amber-400 rounded-xl cursor-pointer disabled:opacity-30"
            >
              {savingKey === 'homepage_banner' ? 'Saving...' : 'Save Hero Banner'}
            </button>
          </div>
        </div>

        {/* Section 4: Checkout Payments & Delivery Message */}
        <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Payments & Delivery Info</h3>
                <p className="text-xs text-zinc-500 mt-0.5">UPI ID settings and delivery notes shown on Checkout Drawer</p>
              </div>
              {lockCoreSettings && (
                <span className="px-2 py-0.5 text-[9px] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-md uppercase">Owner/Manager Only</span>
              )}
            </div>

            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Store UPI ID</label>
                  <input
                    type="text"
                    disabled={lockCoreSettings || isReadOnly}
                    value={settings.payment_instructions.upi_id}
                    onChange={(e) => setSettings({
                      ...settings,
                      payment_instructions: { ...settings.payment_instructions, upi_id: e.target.value }
                    })}
                    placeholder="shubhamart@upi"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-zinc-150 outline-none disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">Payee Name</label>
                  <input
                    type="text"
                    disabled={lockCoreSettings || isReadOnly}
                    value={settings.payment_instructions.payee_name}
                    onChange={(e) => setSettings({
                      ...settings,
                      payment_instructions: { ...settings.payment_instructions, payee_name: e.target.value }
                    })}
                    placeholder="Shubham Art Studio"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-zinc-150 outline-none disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">UPI QR Code Image Link</label>
                <input
                  type="text"
                  disabled={lockCoreSettings || isReadOnly}
                  value={settings.payment_instructions.qr_code_url}
                  onChange={(e) => setSettings({
                    ...settings,
                    payment_instructions: { ...settings.payment_instructions, qr_code_url: e.target.value }
                  })}
                  placeholder="https://images.unsplash.com/upi-qr-code"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2 text-xs text-zinc-100 outline-none disabled:opacity-50"
                />
              </div>

              <div className="border-t border-zinc-850/50 pt-4">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Delivery Disclaimer Message (Public Checkout)</label>
                <textarea
                  disabled={lockLayoutSettings}
                  rows={2}
                  value={settings.delivery_message.text}
                  onChange={(e) => setSettings({
                    ...settings,
                    delivery_message: { ...settings.delivery_message, text: e.target.value }
                  })}
                  placeholder="We ship across India. Standard catalog works deliver in 5-7 working days. Custom signboards require 10-14 days."
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl px-4 py-2 text-sm text-zinc-150 outline-none resize-none font-sans"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-zinc-850 gap-3">
            <button
              onClick={() => handleUpdateSetting('payment_instructions')}
              disabled={lockCoreSettings || isReadOnly || savingKey === 'payment_instructions'}
              className="px-3.5 py-2 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 text-xs font-semibold text-amber-400 rounded-xl cursor-pointer disabled:opacity-30"
            >
              {savingKey === 'payment_instructions' ? 'Saving...' : 'Save Payment Info'}
            </button>
            <button
              onClick={() => handleUpdateSetting('delivery_message')}
              disabled={lockLayoutSettings || savingKey === 'delivery_message'}
              className="px-3.5 py-2 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 text-xs font-semibold text-amber-400 rounded-xl cursor-pointer disabled:opacity-30"
            >
              {savingKey === 'delivery_message' ? 'Saving...' : 'Save Delivery Msg'}
            </button>
          </div>
        </div>

      </div>

      {/* Section 5: FAQs List */}
      <div className="bg-zinc-900 border border-zinc-850 rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">Frequently Asked Questions (FAQ)</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Manage the list of FAQs displayed on the public website footer pages</p>
          </div>
          {!lockLayoutSettings && (
            <button
              onClick={handleAddFaq}
              className="px-3.5 py-1.5 bg-zinc-950 border border-zinc-850 hover:border-amber-500/30 text-amber-400 text-xs font-semibold rounded-lg cursor-pointer transition-all"
            >
              + Add FAQ Question
            </button>
          )}
        </div>

        {settings.faq.length === 0 ? (
          <div className="bg-zinc-950/40 border border-zinc-850 p-8 rounded-xl text-center text-xs text-zinc-500 italic">
            No FAQs defined. Click "Add FAQ Question" to configure customer queries.
          </div>
        ) : (
          <div className="space-y-4">
            {settings.faq.map((faqItem, idx) => (
              <div key={idx} className="bg-zinc-950 p-4 border border-zinc-850 rounded-xl space-y-3 relative group">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Question #{idx + 1}</span>
                  {!lockLayoutSettings && (
                    <button
                      onClick={() => handleRemoveFaq(idx)}
                      className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 rounded-lg cursor-pointer outline-none transition-all"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <input
                      type="text"
                      disabled={lockLayoutSettings}
                      value={faqItem.question}
                      onChange={(e) => handleUpdateFaq(idx, 'question', e.target.value)}
                      placeholder="e.g. Do you accept custom paintings?"
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none"
                    />
                  </div>
                  <div>
                    <textarea
                      disabled={lockLayoutSettings}
                      rows={2}
                      value={faqItem.answer}
                      onChange={(e) => handleUpdateFaq(idx, 'answer', e.target.value)}
                      placeholder="e.g. Yes! You can request custom acrylic paintings and signboards through our Custom Requests page."
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-500 rounded-lg px-3 py-2 text-xs text-zinc-150 outline-none resize-none font-sans"
                    />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-4 border-t border-zinc-850">
              <button
                onClick={() => handleUpdateSetting('faq')}
                disabled={lockLayoutSettings || savingKey === 'faq'}
                className="px-4 py-2 bg-zinc-950 border border-zinc-800 hover:border-amber-500/40 text-xs font-semibold text-amber-400 rounded-xl cursor-pointer disabled:opacity-30"
              >
                {savingKey === 'faq' ? 'Saving...' : 'Save FAQs'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
