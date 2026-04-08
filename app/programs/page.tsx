import Link from 'next/link'
import { Clock, Users, Target, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react'

export default function ProgramsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* 헤더 */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 text-sm px-4 py-1.5 rounded-full mb-4">
          치유농장 체험 프로그램
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">치유농장 힐링 체험</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          도시의 일상에서 벗어나 자연 속에서 진정한 힐링을 경험하세요.
          전문 농장 운영자와 함께하는 체계적인 치유 프로그램입니다.
        </p>
      </div>

      {/* 대표 이미지 자리 */}
      <div className="rounded-3xl bg-gradient-to-br from-green-200 to-green-400 h-64 flex items-center justify-center mb-12">
        <p className="text-green-800 font-medium">체험 이미지</p>
      </div>

      {/* 핵심 정보 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <div className="bg-green-50 rounded-2xl p-6 text-center">
          <Clock className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <div className="font-semibold text-gray-900 mb-1">소요 시간</div>
          <div className="text-2xl font-bold text-green-700">2시간</div>
        </div>
        <div className="bg-green-50 rounded-2xl p-6 text-center">
          <Users className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <div className="font-semibold text-gray-900 mb-1">참여 인원</div>
          <div className="text-2xl font-bold text-green-700">최대 15명</div>
          <div className="text-xs text-gray-500 mt-1">농장별 상이</div>
        </div>
        <div className="bg-green-50 rounded-2xl p-6 text-center">
          <Target className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <div className="font-semibold text-gray-900 mb-1">대상</div>
          <div className="text-2xl font-bold text-green-700">전연령</div>
          <div className="text-xs text-gray-500 mt-1">가족·직장인 추천</div>
        </div>
      </div>

      {/* 체험 목적 및 소개 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">체험 목적 및 소개</h2>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-600 leading-relaxed mb-4">
            치유농장 힐링 체험은 현대인의 정신적·신체적 건강 회복을 목적으로 설계된 농업 기반 치유 프로그램입니다.
            자연환경에서의 농업 활동이 스트레스 감소, 정서 안정, 사회적 유대감 형성에 효과적임이 연구를 통해 입증되었습니다.
          </p>
          <p className="text-gray-600 leading-relaxed">
            농작물 수확, 원예 활동, 자연 관찰 등 다양한 활동을 통해 오감을 자극하고, 자연과의 교감을 통해
            일상의 피로와 스트레스를 해소할 수 있습니다.
          </p>
        </div>
      </section>

      {/* 대상자 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">참여 대상</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            '스트레스·번아웃을 경험하는 직장인',
            '자연 체험을 원하는 가족 단위 방문객',
            '정신건강 회복이 필요한 분',
            '농업·자연에 관심 있는 누구나',
            '단체 힐링 프로그램을 찾는 기관·단체',
            '어르신 대상 사회적 활동 프로그램',
          ].map((target, i) => (
            <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
              <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
              <span className="text-sm text-gray-700">{target}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 진행 방식 */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">진행 방식</h2>
        <div className="space-y-3">
          {[
            { time: '00:00', title: '농장 안내 및 오리엔테이션', desc: '농장 소개, 주의사항 안내, 체험 일정 공유' },
            { time: '00:20', title: '농장 둘러보기', desc: '농장 시설 및 재배 작물 관찰, 농업 이해하기' },
            { time: '00:40', title: '본 체험 활동', desc: '농작물 수확, 원예 활동, 자연 체험 등 주요 프로그램' },
            { time: '01:30', title: '자연 치유 프로그램', desc: '명상, 산책, 자연 감상 등 휴식과 회복의 시간' },
            { time: '01:50', title: '소감 나누기 및 마무리', desc: '체험 소감 나누기, 기념 사진 촬영, 농산물 선물' },
          ].map((step, i) => (
            <div key={i} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-green-200 transition-colors">
              <div className="text-xs font-mono font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg shrink-0 h-fit">
                +{step.time}
              </div>
              <div>
                <div className="font-semibold text-gray-900 mb-1">{step.title}</div>
                <div className="text-sm text-gray-500">{step.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 준비물 및 유의사항 */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">준비물 및 유의사항</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-3 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 font-medium">체험 전 꼭 확인해 주세요</div>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            {[
              '편한 복장과 운동화를 착용해 주세요.',
              '야외 활동이 포함되므로 날씨에 맞는 준비를 해주세요.',
              '체험 당일 우천 시 일부 프로그램이 변경될 수 있습니다.',
              '예약 확정 후 취소 시 최소 3일 전 연락 바랍니다.',
              '단체 방문(10인 이상)은 사전 별도 문의가 필요합니다.',
              '체험 시작 10분 전까지 농장에 도착해 주세요.',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-amber-500 shrink-0">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center bg-green-800 rounded-3xl p-10 text-white">
        <h3 className="text-2xl font-bold mb-3">지금 바로 체험을 예약하세요</h3>
        <p className="text-green-200 mb-6">전국 16개 치유농장에서 여러분을 기다리고 있습니다</p>
        <Link
          href="/farms"
          className="inline-flex items-center gap-2 bg-white text-green-800 font-semibold px-8 py-3.5 rounded-xl hover:bg-green-50 transition-colors shadow-lg"
        >
          농장 선택하러 가기
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  )
}
