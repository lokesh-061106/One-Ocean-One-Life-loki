"use client";

import { useState, useEffect } from "react";
import { Search, Filter, Users, Award, TrendingUp, User, MessageSquare, X, Star } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PageHero } from "@/components/layout/page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { profiles as mockProfiles, getUser, getVillage } from "@/lib/data";
import { formatNumber } from "@/lib/utils";
import { ApiMember, resolveName, resolveStr, fetchCmsList } from "@/lib/api-helpers";
import { LocationDisplay } from "@/components/location-display";

const statusColors: Record<string, string> = { active: "bg-ocean-green text-white", engaged: "bg-ocean-warning text-white", occasional: "bg-ocean-muted text-white" };
const occupationColors: Record<string, string> = { Fisherman: "bg-ocean-blue/10 text-ocean-blue", "Community Leader": "bg-ocean-green/10 text-ocean-green", "Marine Researcher": "bg-ocean-coral/10 text-ocean-coral", Educator: "bg-ocean-warning/10 text-ocean-warning", "Community Volunteer": "bg-ocean-info/10 text-ocean-info", "Marine Biologist": "bg-ocean-navy/10 text-ocean-navy" };

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type MemberRow = {
  id: string;
  displayName: string;
  villageName: string;
  occupation: string;
  bio: string;
  contribution_score: number;
  member_status: string;
};

function mapApiMember(m: ApiMember): MemberRow {
  return {
    id: m.id,
    displayName: resolveName(m.user),
    villageName: resolveStr(m.village),
    occupation: m.occupation,
    bio: m.bio,
    contribution_score: m.contribution_score,
    member_status: m.member_status,
  };
}

function mapMockMember(p: { id: string; user_id: string; village_id: string; occupation: string; bio: string; contribution_score: number; member_status: string }): MemberRow {
  const user = getUser(p.user_id);
  const village = getVillage(p.village_id);
  return {
    id: p.id,
    displayName: user ? `${user.first_name} ${user.last_name}`.trim() : "",
    villageName: village?.name || "",
    occupation: p.occupation,
    bio: p.bio,
    contribution_score: p.contribution_score,
    member_status: p.member_status,
  };
}

function ProfileModal({ member, onClose }: { member: MemberRow; onClose: () => void }) {
  if (!member) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-gradient-to-r from-ocean-deep to-ocean-blue p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/80 hover:text-white"><X className="h-5 w-5" /></button>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white/30">
              <AvatarFallback className="bg-white/20 text-white text-xl font-bold">{member.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{member.displayName}</h2>
              <div className="flex items-center gap-1 text-sm text-ocean-sand"><LocationDisplay name={member.villageName} showCoords={false} size="sm" className="text-ocean-sand" /></div>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Badge className={statusColors[member.member_status]}>{member.member_status}</Badge>
            <Badge className={occupationColors[member.occupation] || "bg-ocean-light text-ocean-navy"}>{member.occupation}</Badge>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-ocean-navy mb-1">About</h4>
            <p className="text-sm text-ocean-text-secondary leading-relaxed">{member.bio || "No bio provided."}</p>
          </div>
          <div className="bg-ocean-light rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-ocean-blue mb-1"><Star className="h-4 w-4" /><span className="text-xl font-bold">{member.contribution_score}</span></div>
                <p className="text-xs text-ocean-text-secondary">Impact Score</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-ocean-green mb-1"><TrendingUp className="h-4 w-4" /><span className="text-xl font-bold">{Math.round(member.contribution_score / 15)}%</span></div>
                <p className="text-xs text-ocean-text-secondary">Progress</p>
              </div>
            </div>
            <div className="mt-3 h-2 bg-white rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-ocean-blue to-ocean-green rounded-full" style={{ width: `${Math.min(member.contribution_score / 15, 100)}%` }} />
            </div>
          </div>
          <Button className="w-full" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

export default function MembersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberRow | null>(null);

  useEffect(() => {
    fetchCmsList<ApiMember>("/auth/members/").then((apiMembers) => {
      if (apiMembers.length > 0) {
        setMembers(apiMembers.map(mapApiMember));
      } else {
        setMembers(mockProfiles.map(mapMockMember));
      }
    });
  }, []);

  const filteredMembers = members.filter((m) => {
    return m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || m.villageName.toLowerCase().includes(searchQuery.toLowerCase()) || m.occupation.toLowerCase().includes(searchQuery.toLowerCase());
  });
  const stats = { total: members.length, active: members.filter(m => m.member_status === 'active').length, totalScore: members.reduce((s, m) => s + m.contribution_score, 0) };

  return (
    <div className="min-h-screen bg-ocean-foam">
      <Header />
      <main>
        <PageHero
          badge={<Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">Community Network</Badge>}
          title="Community Members"
          subtitle={`Connect with ${stats.total}+ fishermen, researchers, and coastal communities.`}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-ocean-blue/10 flex items-center justify-center"><Users className="h-5 w-5 text-ocean-blue" /></div><div><p className="text-2xl font-bold text-ocean-navy">{stats.total}</p><p className="text-sm text-ocean-text-secondary">Total Members</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-ocean-green/10 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-ocean-green" /></div><div><p className="text-2xl font-bold text-ocean-navy">{stats.active}</p><p className="text-sm text-ocean-text-secondary">Active Members</p></div></div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-ocean-coral/10 flex items-center justify-center"><Award className="h-5 w-5 text-ocean-coral" /></div><div><p className="text-2xl font-bold text-ocean-navy">{formatNumber(stats.totalScore)}</p><p className="text-sm text-ocean-text-secondary">Total Score</p></div></div></CardContent></Card>
          </div>
          <div className="relative mb-8"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ocean-muted" /><Input placeholder="Search members by name, village, occupation..." className="pl-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMembers.map((member) => {
              return (
                <Card key={member.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="h-14 w-14"><AvatarFallback className="bg-ocean-blue text-white text-lg font-semibold">{member.displayName.charAt(0)}</AvatarFallback></Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-ocean-navy text-lg">{member.displayName}</h3>
                        <div className="flex items-center gap-2 text-sm text-ocean-text-secondary"><LocationDisplay name={member.villageName} showCoords={false} size="sm" /></div>
                      </div>
                      <Badge className={statusColors[member.member_status]}>{member.member_status}</Badge>
                    </div>
                    <p className="text-sm text-ocean-text-secondary mb-3 line-clamp-2">{member.bio}</p>
                    <Badge className={occupationColors[member.occupation] || "bg-ocean-light text-ocean-navy"}>{member.occupation}</Badge>
                    <div className="bg-ocean-light rounded-lg p-4 mt-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div><p className="text-lg font-bold text-ocean-blue">{member.contribution_score}</p><p className="text-xs text-ocean-text-secondary">Score</p></div>
                        <div><p className="text-lg font-bold text-ocean-green">{Math.round(member.contribution_score / 15)}%</p><p className="text-xs text-ocean-text-secondary">Progress</p></div>
                      </div>
                      <div className="mt-3 h-2 bg-ocean-border rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-ocean-blue to-ocean-green rounded-full" style={{ width: `${Math.min(member.contribution_score / 15, 100)}%` }} />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" className="flex-1" onClick={() => setSelectedMember(member)}>
                        <User className="mr-2 h-4 w-4" />View Profile
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => alert(`Message feature coming soon for ${member.displayName}`)}>
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
      {selectedMember && <ProfileModal member={selectedMember} onClose={() => setSelectedMember(null)} />}
      <Footer />
    </div>
  );
}
