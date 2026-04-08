import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

const BUCKET = 'farm-images'

// POST /api/admin/farm/images — 이미지 업로드
export async function POST(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  const farmId = formData.get('farmId')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
  }
  if (typeof farmId !== 'string') {
    return NextResponse.json({ error: 'farmId가 없습니다.' }, { status: 400 })
  }

  // farm_admin은 본인 농장만
  if (session.role === 'farm_admin' && session.farmId !== farmId) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${farmId}/${Date.now()}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const supabase = await createAdminClient()
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('storage upload error:', uploadError)
    return NextResponse.json({ error: '이미지 업로드에 실패했습니다.' }, { status: 500 })
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}

// DELETE /api/admin/farm/images?path=... — 이미지 삭제
export async function DELETE(request: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  if (!path) return NextResponse.json({ error: 'path가 없습니다.' }, { status: 400 })

  // farm_admin은 본인 농장 경로만 삭제 가능
  if (session.role === 'farm_admin') {
    const farmFolder = path.split('/')[0]
    if (farmFolder !== session.farmId) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }
  }

  const supabase = await createAdminClient()
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) {
    console.error('storage delete error:', error)
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}
