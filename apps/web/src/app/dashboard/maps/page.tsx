"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Plus, Edit, Trash2, MapPin, Navigation, MoreHorizontal, Phone, CheckCircle, X } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDashboardData, type DashboardHotspot, type DashboardEmergencyContact } from "@/components/dashboard-data-context";
import { CrudForm, Field } from "@/components/ui/crud-form";
import { zones } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

/* MapLibre is client-only; keep it out of the SSR bundle (same
   pattern as the storefront /map page). */
const DashboardHotspotMap = dynamic(
  () => import("@/components/map/dashboard-hotspot-map"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-ocean-light rounded-xl h-96 flex items-center justify-center">
        <p className="text-sm text-ocean-text-secondary">Loading map…</p>
      </div>
    ),
  }
);

const densityColors: Record<string, string> = { low: "bg-ocean-blue text-white", medium: "bg-ocean-warning text-white", high: "bg-ocean-coral text-white", very_high: "bg-ocean-danger text-white" };
const typeColors: Record<string, string> = { "Coast Guard": "bg-ocean-blue/10 text-ocean-blue", Police: "bg-ocean-info/10 text-ocean-info", Hospital: "bg-ocean-green/10 text-ocean-green", Fire: "bg-ocean-coral/10 text-ocean-coral", Emergency: "bg-ocean-danger/10 text-ocean-danger" };

const hotspotFields: Field[] = [
  { key: "name", label: "Hotspot Name", type: "text", placeholder: "e.g. Nagapattinam Reef", required: true },
  { key: "zone_id", label: "Zone", type: "select", required: true, options: zones.map(z => ({ value: z.id, label: z.name })) },
  { key: "contributions", label: "Contributions", type: "number", placeholder: "0", required: true },
  { key: "density", label: "Density", type: "select", required: true, options: [{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "very_high", label: "Very High" }] },
  { key: "lat", label: "Latitude", type: "number", placeholder: "e.g. 10.7667", required: true },
  { key: "lng", label: "Longitude", type: "number", placeholder: "e.g. 79.8417", required: true },
];

const contactFields: Field[] = [
  { key: "name", label: "Contact Name", type: "text", placeholder: "e.g. Coast Guard - Chennai", required: true },
  { key: "contact_type", label: "Contact Type", type: "select", required: true, options: [{ value: "Coast Guard", label: "Coast Guard" }, { value: "Police", label: "Police" }, { value: "Hospital", label: "Hospital" }, { value: "Fire", label: "Fire" }, { value: "Emergency", label: "Emergency" }] },
  { key: "phone", label: "Phone", type: "text", placeholder: "e.g. 100", required: true },
  { key: "village_id", label: "Village", type: "text", placeholder: "Village name", required: true },
];

type View = "list" | "add_hotspot" | "edit_hotspot" | "add_contact" | "edit_contact";

export default function MapsPage() {
  const {
    hotspots, addHotspot, updateHotspot, deleteHotspot,
    emergencyContacts, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact,
    loading,
  } = useDashboardData();

  const [view, setView] = useState<View>("list");
  const [selectedHs, setSelectedHs] = useState<DashboardHotspot | null>(null);
  const [selectedEc, setSelectedEc] = useState<DashboardEmergencyContact | null>(null);
  const [toast, setToast] = useState<{ message: string; visible: boolean }>({ message: "", visible: false });

  const showToast = useCallback((message: string) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);
  }, []);

  const openAddHotspot = () => { setSelectedHs(null); setView("add_hotspot"); };
  const openEditHotspot = (hs: DashboardHotspot) => { setSelectedHs(hs); setView("edit_hotspot"); };
  const handleDeleteHotspot = async (hs: DashboardHotspot) => {
    try { await deleteHotspot(hs.id); showToast(`${hs.name} deleted`); }
    catch (err: any) { showToast(err.message || "Failed to delete"); }
  };
  const handleSaveHotspot = async (data: Record<string, any>) => {
    const payload = { name: data.name, zone_id: data.zone_id, contributions: Number(data.contributions), density: data.density, lat: Number(data.lat), lng: Number(data.lng) };
    try {
      if (view === "add_hotspot") { await addHotspot(payload); showToast(`${data.name} added`); }
      else { await updateHotspot(selectedHs!.id, payload); showToast(`${data.name} updated`); }
    } catch (err: any) { showToast(err.message || "Failed to save"); }
    setView("list"); setSelectedHs(null);
  };

  const openAddContact = () => { setSelectedEc(null); setView("add_contact"); };
  const openEditContact = (ec: DashboardEmergencyContact) => { setSelectedEc(ec); setView("edit_contact"); };
  const handleDeleteContact = async (ec: DashboardEmergencyContact) => {
    try { await deleteEmergencyContact(ec.id); showToast(`${ec.name} deleted`); }
    catch (err: any) { showToast(err.message || "Failed to delete"); }
  };
  const handleSaveContact = async (data: Record<string, any>) => {
    try {
      if (view === "add_contact") { await addEmergencyContact({ name: data.name, contact_type: data.contact_type, phone: data.phone, village_id: data.village_id, is_active: true }); showToast(`${data.name} added`); }
      else { await updateEmergencyContact(selectedEc!.id, { name: data.name, contact_type: data.contact_type, phone: data.phone, village_id: data.village_id }); showToast(`${data.name} updated`); }
    } catch (err: any) { showToast(err.message || "Failed to save"); }
    setView("list"); setSelectedEc(null);
  };

  const cancelForm = () => { setView("list"); setSelectedHs(null); setSelectedEc(null); };
  const isHsForm = view === "add_hotspot" || view === "edit_hotspot";
  const isEcForm = view === "add_contact" || view === "edit_contact";

  return (
    <DashboardLayout>
      {toast.visible && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-ocean-green text-white px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-top-5">
          <CheckCircle className="h-4 w-4" /><span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast({ message: "", visible: false })} className="ml-2"><X className="h-4 w-4" /></button>
        </div>
      )}

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ocean-navy">Maps & Locations</h1>
            <p className="text-ocean-text-secondary">Manage ocean hotspots and emergency contacts.</p>
          </div>
          {view === "list" && (
            <Button onClick={openAddHotspot}><Plus className="mr-2 h-4 w-4" />Add Location</Button>
          )}
        </div>

        <Tabs defaultValue="hotspots">
          <TabsList>
            <TabsTrigger value="hotspots">Ocean Hotspots</TabsTrigger>
            <TabsTrigger value="emergency">Emergency Contacts</TabsTrigger>
            <TabsTrigger value="zones">Coastal Zones</TabsTrigger>
          </TabsList>

          <TabsContent value="hotspots" className="mt-6 space-y-6">
            {isHsForm && <CrudForm title="Hotspot" fields={hotspotFields} initialData={selectedHs || undefined} mode={view === "add_hotspot" ? "add" : "edit"} onSave={handleSaveHotspot} onCancel={cancelForm} />}
            {!isHsForm && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-2">
                    <CardHeader><CardTitle>Hotspot Map</CardTitle><CardDescription>Geographic distribution of contribution hotspots</CardDescription></CardHeader>
                    <CardContent>
                      <DashboardHotspotMap
                        hotspots={hotspots.map((hs) => ({
                          id: hs.id,
                          name: hs.name,
                          lat: hs.lat,
                          lng: hs.lng,
                          density: hs.density,
                          contributions: hs.contributions,
                          zoneName: zones.find((z) => z.id === hs.zone_id)?.name,
                        }))}
                        height={384}
                      />
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle>Hotspot Statistics</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between"><span className="text-sm text-ocean-text-secondary">Total Hotspots</span><span className="font-semibold text-ocean-navy">{hotspots.length}</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-ocean-text-secondary">Very High Density</span><span className="font-semibold text-ocean-danger">{hotspots.filter(h => h.density === "very_high").length}</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-ocean-text-secondary">High Density</span><span className="font-semibold text-ocean-coral">{hotspots.filter(h => h.density === "high").length}</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-ocean-text-secondary">Medium Density</span><span className="font-semibold text-ocean-warning">{hotspots.filter(h => h.density === "medium").length}</span></div>
                    </CardContent>
                  </Card>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader><TableRow><TableHead>Hotspot Name</TableHead><TableHead>Zone</TableHead><TableHead>Contributions</TableHead><TableHead>Density</TableHead><TableHead>Coordinates</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {hotspots.map(hs => {
                          const zone = zones.find(z => z.id === hs.zone_id);
                          return (
                            <TableRow key={hs.id}>
                              <TableCell><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-ocean-blue" /><span className="font-medium text-ocean-navy">{hs.name}</span></div></TableCell>
                              <TableCell className="text-ocean-text-secondary">{zone?.name}</TableCell>
                              <TableCell className="font-semibold text-ocean-blue">{formatNumber(hs.contributions)}</TableCell>
                              <TableCell><Badge className={densityColors[hs.density]}>{hs.density.replace("_", " ")}</Badge></TableCell>
                              <TableCell className="text-sm text-ocean-text-secondary font-mono">{hs.lat.toFixed(4)}, {hs.lng.toFixed(4)}</TableCell>
                              <TableCell className="text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => openEditHotspot(hs)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-ocean-danger" onClick={() => handleDeleteHotspot(hs)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {hotspots.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-ocean-text-secondary">{loading ? "Loading hotspots..." : "No hotspots found."}</TableCell></TableRow>}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="emergency" className="mt-6">
            {isEcForm && <CrudForm title="Emergency Contact" fields={contactFields} initialData={selectedEc || undefined} mode={view === "add_contact" ? "add" : "edit"} onSave={handleSaveContact} onCancel={cancelForm} />}
            {!isEcForm && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div><CardTitle>Emergency Contacts</CardTitle><CardDescription>Manage emergency service contacts</CardDescription></div>
                  <Button onClick={openAddContact}><Plus className="mr-2 h-4 w-4" />Add Contact</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Phone</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {emergencyContacts.map(contact => (
                        <TableRow key={contact.id}>
                          <TableCell className="font-medium text-ocean-navy">{contact.name}</TableCell>
                          <TableCell><Badge className={typeColors[contact.contact_type] || ""}>{contact.contact_type}</Badge></TableCell>
                          <TableCell><div className="flex items-center gap-2"><Phone className="h-4 w-4 text-ocean-green" /><span className="font-mono font-semibold">{contact.phone}</span></div></TableCell>
                          <TableCell>{contact.is_active ? <Badge className="bg-ocean-green text-white">Active</Badge> : <Badge className="bg-ocean-muted text-white">Inactive</Badge>}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditContact(contact)}><Edit className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(`tel:${contact.phone}`)}><Phone className="mr-2 h-4 w-4" />Test Call</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-ocean-danger" onClick={() => handleDeleteContact(contact)}><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {emergencyContacts.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-ocean-text-secondary">{loading ? "Loading contacts..." : "No emergency contacts found."}</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="zones" className="mt-6">
            <Card>
              <CardHeader><CardTitle>Coastal Zones</CardTitle><CardDescription>Tamil Nadu coastal zone management</CardDescription></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {zones.map(zone => (
                    <Card key={zone.id} className="hover:shadow-md transition-shadow cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-ocean-blue/10 flex items-center justify-center"><Navigation className="h-6 w-6 text-ocean-blue" /></div>
                        <h3 className="font-semibold text-ocean-navy">{zone.name}</h3>
                        <p className="text-xs text-ocean-text-secondary mb-2">Zone {zone.zone_number}</p>
                        <div className="text-2xl font-bold text-ocean-blue mb-1">{zone.score}%</div>
                        <p className="text-xs text-ocean-muted">{zone.villages} villages</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
