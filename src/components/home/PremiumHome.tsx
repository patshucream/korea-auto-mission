import Link from "next/link";
import { getWorkServiceLabels, workMatchesService } from "@/lib/works/services";
import type { CSSProperties, ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomBar } from "@/components/layout/MobileBottomBar";
import { SmartImage } from "@/components/ui/SmartImage";
import { Reviews } from "@/components/home/Reviews";
import {
  getHomepageConfig,
  getWhyPoints,
  HOME_SYMPTOM_CARDS,
  isSectionVisible,
} from "@/lib/homepage";
import type {
  HomepageData,
  HomepageSectionId,
  ReviewStats,
  Service,
  WorkCase,
} from "@/lib/types";
import {
  formatDateKo,
  getBlogUrl,
  getMapUrl,
  getReservationUrl,
  telHref,
} from "@/lib/utils";
import s from "./PremiumHome.module.css";

const Arrow = () => <span aria-hidden="true">↗</span>;
const cx = (...names: string[]) => names.map((name) => s[name]).join(" ");

function SectionLabel({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className={s["section-label"]}>
      <span className={s.eyebrow}>{title}</span>
      {children}
    </div>
  );
}

function selectFeatured<T extends { id: string }>(
  items: T[],
  ids: string[],
): T[] {
  if (!ids.length) return items;
  const index = new Map(items.map((item) => [item.id, item]));
  const selected = ids.flatMap((id) => (index.has(id) ? [index.get(id)!] : []));
  return selected.length ? selected : items;
}

function WorkJournal({ works }: { works: WorkCase[] }) {
  const [featured, ...rest] = works.slice(0, 4);
  if (!featured) return null;
  const vehicle = [
    featured.manufacturer || featured.vehicle_brand,
    featured.vehicle_model,
  ]
    .filter(Boolean)
    .join(" ");
  const facts = [
    { label: "입고 증상", value: featured.symptoms },
    { label: "진단 내용", value: featured.diagnosis },
    {
      label: "정비 내용",
      value: featured.replaced_parts || featured.work_summary,
    },
  ].filter(
    (row) => row.value?.trim() && row.value.trim() !== featured.excerpt?.trim(),
  );
  return (
    <section id="works" className={cx("work-section", "section-pad")}>
      <SectionLabel title="WORK JOURNAL">
        <Link className={cx("text-link", "dark-link")} href="/works">
          작업사례 전체 보기 <Arrow />
        </Link>
      </SectionLabel>
      <div className={s["section-heading"]}>
        <h2>기술은, 과정으로 증명합니다.</h2>
        <p>실제 차량의 입고부터 정비까지.</p>
      </div>
      <article className={s["featured-work"]}>
        <Link
          className={s["work-photo"]}
          href={`/works/${featured.slug}`}
          aria-label={`${featured.title} 자세히 보기`}
        >
          <SmartImage
            path={
              featured.representative_image_path ||
              featured.gallery_image_paths?.[0]
            }
            alt={featured.title}
            className={s["media-fill"]}
            sizes="(max-width: 760px) 100vw, 50vw"
            fallbackLabel={vehicle}
          />
          <span className={s["image-caption"]}>
            ACTUAL WORK / 실제 정비 기록
          </span>
        </Link>
        <div className={s["work-copy"]}>
          <p className={s.eyebrow}>
            {vehicle} · {getWorkServiceLabels(featured).join(" · ")}
          </p>
          <h3>
            <Link href={`/works/${featured.slug}`}>{featured.title}</Link>
          </h3>
          {featured.excerpt && (
            <p className={s["work-model"]}>{featured.excerpt}</p>
          )}
          {facts.length > 0 ? (
            <dl className={s["case-facts"]}>
              {facts.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className={s["case-intro"]}>
              입고부터 정비까지,
              <br />
              실제 작업 과정을 사진과 함께 확인해 보세요.
            </p>
          )}
          <p className={s["work-date"]}>
            {formatDateKo(featured.published_at || featured.created_at)}
          </p>
          <Link
            className={cx("text-link", "dark-link", "case-link")}
            href={`/works/${featured.slug}`}
          >
            진단부터 수리까지 자세히 보기 <Arrow />
          </Link>
        </div>
      </article>
      {rest.length > 0 && (
        <div className={s["more-works"]}>
          {rest.map((work) => (
            <Link
              href={`/works/${work.slug}`}
              key={work.id}
              className={s["work-teaser"]}
            >
              <SmartImage
                path={work.representative_image_path}
                alt={work.title}
                className="aspect-[4/3] w-full"
                sizes="(max-width: 760px) 100vw, 33vw"
                fallbackLabel={work.vehicle_model}
              />
              <p>
                {work.vehicle_brand} · {getWorkServiceLabels(work).join(" · ")}
              </p>
              <h3>{work.title}</h3>
              <span>정비 기록 보기 ↗</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function Specialties({
  services,
  works,
  phone,
}: {
  services: Service[];
  works: WorkCase[];
  phone: string;
}) {
  return (
    <section id="services" className={cx("services-section", "section-pad")}>
      <div className={s["services-intro"]}>
        <span className={s.eyebrow}>OUR SPECIALTIES</span>
        <h2>
          주행의 핵심을
          <br />
          정비합니다.
        </h2>
        <p>
          차량의 상태를 살피고,
          <br />
          필요한 정비를 정확히 안내합니다.
        </p>
        <a className={s["text-link"]} href={telHref(phone)}>
          정비 가능 여부 문의 <Arrow />
        </a>
      </div>
      <div className={s["services-list"]}>
        {services.map((service, index) => {
          const hasCases = works.some(
            (work) => workMatchesService(work, service),
          );
          return (
            <details key={service.id}>
              <summary>
                <span className={s["service-number"]}>
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{service.title}</span>
                <span className={s.plus} aria-hidden="true" />
              </summary>
              <div className={s["service-content"]}>
                <p>
                  {service.detailed_description || service.short_description}
                </p>
                {service.title === "오토미션 수리" ? <div><Link href="/services/transmission">부산 미션수리 · 진단과 입고 안내 ↗</Link></div> : null}
                {/흡기|인젝터|DPF/.test(service.title) ? <div><Link href="/services/diesel-cleaning">부산 디젤 클리닝 · 작업별 상담 안내 ↗</Link></div> : null}
                {service.image_path && (
                  <SmartImage
                    path={service.image_path}
                    alt={service.title}
                    className={s["service-photo"]}
                  />
                )}
                {hasCases ? (
                  <Link
                    href={`/works?service=${encodeURIComponent(service.id)}`}
                  >
                    관련 작업사례 보기 ↗
                  </Link>
                ) : (
                  <a href={telHref(phone)}>증상 상담하기 ↗</a>
                )}
              </div>
            </details>
          );
        })}
        {!services.length && (
          <p className={s["no-services"]}>
            차종과 증상을 알려주시면 정비 가능 여부를 안내해 드립니다.
          </p>
        )}
      </div>
    </section>
  );
}

export function PremiumHome({
  data,
  reviewStats,
}: {
  data: HomepageData;
  reviewStats: ReviewStats;
}) {
  const { settings } = data;
  const config = getHomepageConfig(settings);
  const works = selectFeatured(data.works, config.featured_work_ids);
  const services = selectFeatured(data.services, config.featured_service_ids);
  const points = getWhyPoints(settings);
  const phone = telHref(settings.phone);
  const reserve = getReservationUrl(settings);
  const blog = getBlogUrl(settings);
  const visible = (id: HomepageSectionId) =>
    config.section_order.includes(id) && isSectionVisible(config, id);
  const brands = [
    ...new Set(data.works.map((work) => work.vehicle_brand).filter(Boolean)),
  ];
  const hours = [
    ["평일", settings.weekday_hours],
    ["토요일", settings.saturday_hours],
    ["일요일", "휴무"],
    ["공휴일", settings.holiday_hours],
  ];

  const sections: Partial<Record<HomepageSectionId, ReactNode>> = {
    hero: (
      <section className={s.hero} aria-labelledby="hero-title">
        <div className={s["hero-copy"]}>
          <p className={s.eyebrow}>
            <span className={s.line} />
            PRECISION IN EVERY SHIFT
          </p>
          <h1 id="hero-title">
            {settings.hero_title || "다시, 부드러운\n주행의 시작."}
          </h1>
          <p className={s["hero-description"]}>{settings.hero_description}</p>
          <div className={s["hero-actions"]}>
            <a className={cx("button", "button-copper")} href={phone}>
              전화로 증상 상담 <Arrow />
            </a>
            <Link className={s["text-link"]} href="/works">
              실제 정비사례 보기 <span aria-hidden="true">↓</span>
            </Link>
          </div>
          <p style={{ marginTop: 20, fontSize: 15, color: "#d6dcd7" }}><a href={phone}>{settings.phone}</a> · {settings.address}</p>
          <div className={s["hero-bottom"]}>
            <span>수입차 · 국산차 자동변속기 전문</span>
            <span>{settings.english_brand_name}</span>
          </div>
        </div>
        <figure className={s["hero-photo"]}>
          <SmartImage
            path={settings.hero_image_path || settings.shop_image_path}
            alt={`${settings.business_name} 실제 정비 현장`}
            className={s["media-fill"]}
            sizes="(max-width: 760px) 100vw, 50vw"
            priority
            fallbackLabel={settings.business_name}
          />
          <div className={s["photo-overlay"]} aria-hidden="true" />
          <figcaption>
            <span>현장에서 쌓아온 정비 경험</span>
            <strong>{settings.stat_experience}</strong>
            <small>진단부터 수리까지, 한 곳에서.</small>
          </figcaption>
          <span className={s["photo-note"]}>{settings.address}</span>
        </figure>
      </section>
    ),
    trust:
      config.trust_items.length > 0 ? (
        <section
          id="strength"
          className={s["trust-strip"]}
          aria-label="핵심 정비 정보"
        >
          {config.trust_items.map((item, index) => (
            <div key={`${item.title}-${index}`}>
              <strong>{item.title}</strong>
              <span>{item.description}</span>
            </div>
          ))}
        </section>
      ) : null,
    symptoms: (
      <section
        className={s["symptom-strip"]}
        aria-label="증상으로 작업사례 찾기"
      >
        <div>
          <span className={s.eyebrow}>FIND YOUR SYMPTOM</span>
          <h2>어떤 증상이 있으신가요?</h2>
        </div>
        <div className={s["symptom-links"]}>
          {HOME_SYMPTOM_CARDS.map((item) => (
            <Link href={item.href} key={item.label}>
              {item.label} <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>
    ),
    services: (
      <Specialties
        services={services}
        works={data.works}
        phone={settings.phone}
      />
    ),
    why: (
      <section id="why" className={cx("intro", "section-pad")}>
        <SectionLabel title="OUR STANDARD">
          <span className={s["small-note"]}>
            {settings.business_name}의 정비 기준
          </span>
        </SectionLabel>
        <div className={s["intro-heading"]}>
          <h2>
            {settings.why_title || "좋은 정비는,\n정확한 진단에서 시작됩니다."}
          </h2>
          <p>{settings.why_content}</p>
        </div>
        <div
          className={s.principles}
          style={
            { "--principle-count": Math.min(points.length, 4) } as CSSProperties
          }
        >
          {points.map((point, index) => (
            <article key={point.id}>
              {point.image_path && (
                <SmartImage
                  path={point.image_path}
                  alt={point.title}
                  className={s["principle-image"]}
                  objectPosition={point.object_position}
                />
              )}
              <span className={s.number}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3>{point.title}</h3>
              <p>{point.body}</p>
            </article>
          ))}
        </div>
      </section>
    ),
    works: <WorkJournal works={works} />,
    process:
      settings.process_steps.length > 0 ? (
        <section id="process" className={cx("process-section", "section-pad")}>
          <SectionLabel title="YOUR VISIT">
            <span className={s["small-note"]}>처음 방문하셔도 편안하게</span>
          </SectionLabel>
          <h2>상담부터 출고까지, 명확하게.</h2>
          <ol
            className={s.process}
            style={
              {
                "--step-count": Math.min(settings.process_steps.length, 6),
              } as CSSProperties
            }
          >
            {settings.process_steps.map((step, index) => (
              <li key={`${step.title}-${index}`}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </section>
      ) : null,
    brands:
      brands.length > 0 ? (
        <section className={s["brand-strip"]} aria-label="브랜드별 정비사례">
          <span>차종별 정비 기록</span>
          <div>
            {brands.map((brand) => (
              <Link
                key={brand}
                href={`/works?brand=${encodeURIComponent(brand)}`}
              >
                {brand} ↗
              </Link>
            ))}
          </div>
          <Link href="/works">전체 사례 보기 ↗</Link>
        </section>
      ) : null,
    guides:
      works.length > 0 ? (
        <section id="guides" className={cx("guides-section", "section-pad")}>
          <SectionLabel title="MAINTENANCE NOTES" />
          <h2>정비 기록에서 찾는 점검 포인트.</h2>
          <div className={s["guide-list"]}>
            {works.slice(0, 4).map((work) => (
              <Link key={work.id} href={`/works/${work.slug}`}>
                <h3>{work.title}</h3>
                <p>{work.excerpt || work.symptoms}</p>
                <Arrow />
              </Link>
            ))}
          </div>
        </section>
      ) : null,
    reviews:
      data.reviews.length > 0 ? (
        <div className={s["review-section"]}>
          <Reviews
            reviews={data.reviews}
            totalApproved={reviewStats.approved}
            average={reviewStats.averageRating}
          />
        </div>
      ) : null,
    faq:
      data.faqs.length > 0 ? (
        <section id="faq" className={cx("faq-section", "section-pad")}>
          <div className={s.faq}>
            <div>
              <p className={s.eyebrow}>BEFORE YOUR VISIT</p>
              <h2>
                방문 전,
                <br />
                궁금하신 이야기.
              </h2>
            </div>
            <div>
              {data.faqs.map((faq) => (
                <details key={faq.id}>
                  <summary>
                    {faq.question}
                    <span aria-hidden="true">+</span>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null,
    location: (
      <section id="location" className={cx("location-section", "section-pad")}>
        <div className={s["location-copy"]}>
          <p className={s.eyebrow}>VISIT OUR WORKSHOP</p>
          <h2>찾아오시는 길.</h2>
          <h3>{settings.address}</h3>
          <a
            className={cx("text-link", "dark-link")}
            href={getMapUrl(settings)}
            target="_blank"
            rel="noopener noreferrer"
          >
            네이버 지도에서 길찾기 <Arrow />
          </a>
          <dl className={s["business-hours"]}>
            {hours.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className={s["location-note"]}>
            방문 전 전화로 일정을 확인해 주세요.
          </p>
        </div>
        <a
          href={getMapUrl(settings)}
          target="_blank"
          rel="noopener noreferrer"
          className={s["location-photo"]}
          aria-label="네이버 지도에서 코리아오토미션 위치 확인"
        >
          <SmartImage
            path={settings.shop_image_path || settings.hero_image_path}
            alt={`${settings.business_name} 매장`}
            className={s["media-fill"]}
            sizes="(max-width: 760px) 100vw, 50vw"
            fallbackLabel={settings.address}
          />
          <span>코리아오토미션 위치 확인 ↗</span>
        </a>
      </section>
    ),
    cta: (
      <section id="contact" className={cx("visit-section", "section-pad")}>
        <div className={s["visit-copy"]}>
          <span className={s.eyebrow}>LET’S TALK ABOUT YOUR CAR</span>
          <h2>{config.cta_title}</h2>
          <p>{config.cta_description}</p>
          <a className={s.phone} href={phone}>
            {settings.phone} <Arrow />
          </a>
          <div className={s["visit-actions"]}>
            <a
              className={cx("button", "button-copper")}
              href={reserve}
              target="_blank"
              rel="noopener noreferrer"
            >
              네이버 예약 <Arrow />
            </a>
            <a
              className={s["text-link"]}
              href={blog}
              target="_blank"
              rel="noopener noreferrer"
            >
              정비 블로그 <Arrow />
            </a>
          </div>
        </div>
        <div className={s["visit-details"]}>
          <p className={s.eyebrow}>A BETTER DRIVE STARTS HERE</p>
          <h3>
            차량 정보와 증상을
            <br />
            함께 알려주세요.
          </h3>
          <p className={s["contact-tip"]}>
            차종, 주행거리, 증상이 나타나는 상황을 알려주시면 점검 방향을
            안내하는 데 도움이 됩니다.
          </p>
          {visible("location") ? (
            <Link className={s["text-link"]} href="#location">
              위치·영업시간 확인 <Arrow />
            </Link>
          ) : (
            <a
              className={s["text-link"]}
              href={getMapUrl(settings)}
              target="_blank"
              rel="noopener noreferrer"
            >
              지도에서 위치 확인 <Arrow />
            </a>
          )}
        </div>
      </section>
    ),
  };

  return (
    <div className={s.page}>
      <a className={s.skip} href="#main">
        본문으로 바로가기
      </a>
      <Header settings={settings} />
      <main id="main">
        {config.section_order.map((id) =>
          visible(id) && sections[id] ? (
            <div key={id}>{sections[id]}</div>
          ) : null,
        )}
      </main>
      <Footer settings={settings} />
      <MobileBottomBar settings={settings} />
    </div>
  );
}
