import { NextResponse } from "next/server";
import {
  getLead,
  updateLeadStatus,
  listInteractions,
  addInteraction,
} from "@/repositories/leads.repo";
import type { LeadStatus } from "@/types";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const lead = await getLead(id);
    if (!lead) return NextResponse.json({ ok: false }, { status: 404 });
    const interactions = await listInteractions(id);
    return NextResponse.json({ ok: true, lead, interactions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = (await request.json()) as { status?: LeadStatus; note?: string };
    let lead = null;
    if (body.status) {
      lead = await updateLeadStatus(id, body.status);
      await addInteraction(id, "status_change", `Status → ${body.status}`);
    }
    if (typeof body.note === "string" && body.note.trim()) {
      await addInteraction(id, "note", body.note.trim());
    }
    return NextResponse.json({ ok: true, lead });
  } catch (err) {
    const message = err instanceof Error ? err.message : "error";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
