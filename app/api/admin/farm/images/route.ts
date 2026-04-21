import { createAdminClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin-session'
import { NextRequest, NextResponse } from 'next/server'

const BUCKET = 'farm-images'

// POST /api/admin/farm/images — 이미지 업로드 (raw binary body)
export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const farmId = searchParams.get('farmId')
    const ext = searchParams.get('ext') ?? 'jpg'
    const contentType = searchParams.get('type') ?? 'image/jpeg'

    if (!farmId) {
      return NextResponse.json({ error: 'farmId가 없습니다.' }, { status: 400 })
    }

    // farm_admin은 본인 농장만
    if (session.role === 'farm_admin' && session.farmId !== farmId) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    const arrayBuffer = await request.arrayBuffer()
    if (!arrayBuffer.byteLength) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }
    const buffer = Buffer.from(arrayBuffer)

    const path = `${farmId}/${Date.now()}.${ext}`
    const supabase = await createAdminClient()
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: false })

    if (uploadError) {
      console.error('storage upload error:', uploadError)
      return NextResponse.json({ error: `이미지 업로드에 실패했습니다. (${uploadError.message})` }, { status: 500 })
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl })
  } catch (err) {
    console.error('farm image upload error:', err)
    return NextResponse.json({ error: `서버 오류: ${err instanceof Error ? err.message : String(err)}` }, { status: 500 })
  }
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
