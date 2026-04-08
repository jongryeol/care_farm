import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/types/database'

type FarmUpdate = Database['public']['Tables']['farms']['Update']

// PATCH /api/admin/farm — 농장 정보 수정
export async function PATCH(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const body = await request.json()
  const { farmId, name, short_description, description, address, phone, main_phone,
    business_name, representative_name, email, region, image_urls } = body

  if (!farmId) return NextResponse.json({ error: 'farmId가 필요합니다.' }, { status: 400 })

  // farm_admin은 본인 농장만 수정 가능
  if (session.role === 'farm_admin' && session.farmId !== farmId) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const supabase = await createAdminClient()

  const updates: FarmUpdate = { updated_at: new Date().toISOString() }
  if (name !== undefined) updates.name = name
  if (short_description !== undefined) updates.short_description = short_description
  if (description !== undefined) updates.description = description
  if (address !== undefined) updates.address = address
  if (phone !== undefined) updates.phone = phone
  if (main_phone !== undefined) updates.main_phone = main_phone
  if (business_name !== undefined) updates.business_name = business_name
  if (representative_name !== undefined) updates.representative_name = representative_name
  if (email !== undefined) updates.email = email
  if (region !== undefined) updates.region = region
  if (image_urls !== undefined) {
    updates.image_urls = image_urls
    updates.image_url = image_urls[0] ?? null
  }

  const { data, error } = await supabase
    .from('farms')
    .update(updates)
    .eq('id', farmId)
    .select()
    .single()

  if (error) {
    console.error('farm patch error:', error)
    return NextResponse.json({ error: '저장에 실패했습니다.' }, { status: 500 })
  }
  return NextResponse.json({ farm: data })
}
