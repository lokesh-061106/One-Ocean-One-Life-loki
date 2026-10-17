"use client";

import { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Clock, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CMS_API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface CmsPage {
  hero_title?: string; hero_subtitle?: string; content?: string;
  contact_info?: { email_main: string; email_support: string; phone_main: string; phone_secondary: string; address: string; working_hours: string };
  faqs?: { question: string; answer: string }[];
}

export default function ContactPage() {
  const [cms, setCms] = useState<CmsPage | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch(`${CMS_API}/cms/contact/`).then(r => r.ok ? r.json() : null).then(setCms).catch(() => {});
  }, []);

  const contact = cms?.contact_info;
  const faqs = cms?.faqs || [];

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <PageHero
          badge={<Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">Get in Touch</Badge>}
          title={cms?.hero_title || "Contact Us"}
          subtitle={cms?.hero_subtitle || "Have questions? We would love to hear from you."}
        />

        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Info */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-ocean-navy text-lg">Contact Information</h3>
                    {contact?.email_main && (
                      <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-ocean-blue flex-shrink-0" /><div><p className="text-sm text-ocean-text-secondary">Email</p><p className="text-ocean-navy">{contact.email_main}</p>{contact.email_support && <p className="text-ocean-navy">{contact.email_support}</p>}</div></div>
                    )}
                    {contact?.phone_main && (
                      <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-ocean-blue flex-shrink-0" /><div><p className="text-sm text-ocean-text-secondary">Phone</p><p className="text-ocean-navy">{contact.phone_main}</p>{contact.phone_secondary && <p className="text-ocean-navy">{contact.phone_secondary}</p>}</div></div>
                    )}
                    {contact?.address && (
                      <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-ocean-blue flex-shrink-0" /><div><p className="text-sm text-ocean-text-secondary">Address</p><p className="text-ocean-navy">{contact.address}</p></div></div>
                    )}
                    {contact?.working_hours && (
                      <div className="flex items-center gap-3"><Clock className="h-5 w-5 text-ocean-blue flex-shrink-0" /><div><p className="text-sm text-ocean-text-secondary">Working Hours</p><p className="text-ocean-navy">{contact.working_hours}</p></div></div>
                    )}
                    {!contact && (
                      <>
                        <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-ocean-blue" /><div><p className="text-sm text-ocean-text-secondary">Email</p><p className="text-ocean-navy">contact@o3l.org</p></div></div>
                        <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-ocean-blue" /><div><p className="text-sm text-ocean-text-secondary">Phone</p><p className="text-ocean-navy">+91-44-12345678</p></div></div>
                        <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-ocean-blue" /><div><p className="text-sm text-ocean-text-secondary">Address</p><p className="text-ocean-navy">Marine Research Center, Chennai 600001</p></div></div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-6">
                    {submitted ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-ocean-green/10 flex items-center justify-center mx-auto mb-4"><Mail className="h-8 w-8 text-ocean-green" /></div>
                        <h3 className="text-xl font-semibold text-ocean-navy mb-2">Message Sent!</h3>
                        <p className="text-ocean-text-secondary">Thank you for reaching out. We will get back to you within 24 hours.</p>
                        <Button className="mt-6" onClick={() => setSubmitted(false)}>Send Another Message</Button>
                      </div>
                    ) : (
                      <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
                        <h3 className="font-semibold text-ocean-navy text-lg mb-4">Send us a Message</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div><Label htmlFor="name">Name *</Label><Input id="name" required /></div>
                          <div><Label htmlFor="email">Email *</Label><Input id="email" type="email" required /></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Subject *</Label>
                            <Select required><SelectTrigger><SelectValue placeholder="Select a subject" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="general">General Inquiry</SelectItem>
                                <SelectItem value="support">Technical Support</SelectItem>
                                <SelectItem value="partnership">Partnership</SelectItem>
                                <SelectItem value="research">Research Collaboration</SelectItem>
                                <SelectItem value="media">Media Inquiry</SelectItem>
                                <SelectItem value="feedback">Feedback</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div><Label htmlFor="phone">Phone (Optional)</Label><Input id="phone" type="tel" /></div>
                        </div>
                        <div><Label htmlFor="message">Message *</Label><Textarea id="message" rows={5} required /></div>
                        <Button type="submit" className="w-full bg-ocean-blue hover:bg-ocean-blue/90">Send Message</Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs */}
        {faqs.length > 0 && (
          <section className="py-20 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-ocean-navy text-center mb-12">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, i) => (
                  <Card key={i} className="overflow-hidden">
                    <button className="w-full p-4 text-left flex items-center justify-between hover:bg-ocean-light/50" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                      <div className="flex items-center gap-3"><HelpCircle className="h-5 w-5 text-ocean-blue flex-shrink-0" /><span className="font-medium text-ocean-navy">{faq.question}</span></div>
                      {openFaq === i ? <ChevronUp className="h-5 w-5 text-ocean-muted" /> : <ChevronDown className="h-5 w-5 text-ocean-muted" />}
                    </button>
                    {openFaq === i && <div className="px-4 pb-4 pl-12"><p className="text-ocean-text-secondary">{faq.answer}</p></div>}
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
