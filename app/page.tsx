import Link from 'next/link'
import { Leaf, MapPin, Calendar, Users, ArrowRight, CheckCircle } from 'lucide-react'

const features = [
  {
    icon: <Leaf className="w-6 h-6 text-green-600" />,
    title: '자연 치유 체험',
    desc: '농작물 수확, 원예 활동, 자연 관찰 등 다양한 힐링 체험',
  },
  {
    icon: <MapPin className="w-6 h-6 text-green-600" />,
    title: '전국 16개 농장',
    desc: '전국 각지의 엄선된 치유농장에서 가까운 곳을 선택하세요',
  },
  {
    icon: <Calendar className="w-6 h-6 text-green-600" />,
    title: '간편한 온라인 예약',
    desc: '원하는 날짜와 회차를 확인하고 손쉽게 예약하세요',
  },
  {
    icon: <Users className="w-6 h-6 text-green-600" />,
    title: '소규모 맞춤 운영',
    desc: '회차별 정원 관리로 쾌적한 체험 환경을 보장합니다',
  },
]

const steps = [
  { step: '01', title: '농장 선택', desc: '전국 16개 치유농장 중 원하는 곳을 선택하세요' },
  { step: '02', title: '날짜·회차 확인', desc: '농장별 운영 일정과 잔여 인원을 확인하세요' },
  { step: '03', title: '예약 신청', desc: '신청자 정보를 입력하고 예약을 신청하세요' },
  { step: '04', title: '확정 안내', desc: '관리자 확인 후 예약 확정 문자를 받으세요' },
]

export default function HomePage() {
  return (
    <div>
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-br from-green-800 to-green-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('/hero-bg.jpg')] bg-cover bg-center" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-36 text-center">
          <div className="inline-flex items-center gap-2 bg-green-700/50 text-green-100 text-sm px-4 py-1.5 rounded-full mb-6">
            <Leaf className="w-4 h-4" />
            치유농장 체험 예약 서비스
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            자연 속에서<br />
            <span className="text-green-300">몸과 마음을 회복</span>하세요
          </h1>
          <p className="text-lg md:text-xl text-green-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            전국 16개 치유농장에서 다양한 자연 체험 프로그램을 제공합니다.
            지금 바로 원하는 농장과 날짜를 선택해 예약하세요.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/farms"
              className="inline-flex items-center gap-2 bg-white text-green-800 font-semibold px-8 py-3.5 rounded-xl hover:bg-green-50 transition-colors shadow-lg"
            >
              농장 둘러보기
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/programs"
              className="inline-flex items-center gap-2 border-2 border-white/70 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors"
            >
              체험 안내 보기
            </Link>
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">왜 치유농장인가요?</h2>
            <p className="text-gray-500 text-lg">일상에서 벗어나 자연과 함께하는 힐링의 시간</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-green-50 hover:bg-green-100 transition-colors">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-xl shadow-sm mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 예약 흐름 섹션 */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">간단한 4단계 예약</h2>
            <p className="text-gray-500 text-lg">온라인으로 쉽고 빠르게 예약하세요</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-4xl font-black text-green-100 mb-3">{s.step}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{s.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 안내 섹션 */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-green-800 rounded-3xl p-10 md:p-14 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">지금 바로 체험을 예약하세요</h2>
            <p className="text-green-200 text-lg mb-8 max-w-xl mx-auto">
              전국 16개 치유농장에서 여러분을 기다리고 있습니다.
              원하는 날짜와 농장을 선택하고 힐링의 시간을 계획해보세요.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              {['자연 치유 체험', '전문 농장 운영', '소규모 맞춤형', '온라인 간편 예약'].map((tag, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 bg-white/15 text-green-100 text-sm px-4 py-1.5 rounded-full">
                  <CheckCircle className="w-4 h-4" />
                  {tag}
                </span>
              ))}
            </div>
            <Link
              href="/farms"
              className="inline-flex items-center gap-2 bg-white text-green-800 font-semibold px-10 py-4 rounded-xl hover:bg-green-50 transition-colors shadow-lg text-lg"
            >
              농장 목록 보기
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
