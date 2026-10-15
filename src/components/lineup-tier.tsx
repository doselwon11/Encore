"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, GripVertical, Plus, X } from "lucide-react";
import type { Tier } from "@/lib/festival";

export function LineupTier({ tier, index, total, onChange, onMove, onDelete }: { tier: Tier; index: number; total: number; onChange: (tier: Tier) => void; onMove: (direction: number) => void; onDelete: () => void }) {
  const [artist, setArtist] = useState("");
  function addArtist() {
    const name = artist.trim().toUpperCase();
    if (!name) return;
    onChange({ ...tier, artists: [...tier.artists, name] });
    setArtist("");
  }
  return <div className="tier-card">
    <div className="tier-heading"><GripVertical size={14} className="muted"/><input className="tier-name" aria-label={`Tier ${index + 1} name`} value={tier.name} maxLength={30} onChange={e => onChange({ ...tier, name: e.target.value })}/><span className="tier-count">{tier.artists.length}</span><div className="tier-actions"><button disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Move ${tier.name} up`}><ArrowUp size={13}/></button><button disabled={index === total - 1} onClick={() => onMove(1)} aria-label={`Move ${tier.name} down`}><ArrowDown size={13}/></button><button onClick={onDelete} aria-label={`Delete ${tier.name} tier`}><X size={13}/></button></div></div>
    <div className={`artist-chips chips-${Math.min(index, 2)}`}>{tier.artists.map((name, i) => <span className="artist-chip" key={`${name}-${i}`}>{name}<button aria-label={`Remove ${name}`} onClick={() => onChange({ ...tier, artists: tier.artists.filter((_, n) => i !== n) })}><X size={11}/></button></span>)}</div>
    <form className="add-artist" onSubmit={e => { e.preventDefault(); addArtist(); }}><Plus size={13}/><input aria-label={`Add artist to ${tier.name}`} placeholder="Add an artist…" value={artist} maxLength={45} onChange={e => setArtist(e.target.value)}/>{artist.trim() && <button type="submit">Add ↵</button>}</form>
  </div>;
}
