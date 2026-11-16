import Image from "next/image";
import { Icon } from "./Icon";
export function ProductPreview() {
  return (
    <div
      className="product-scene"
      aria-label="Ilustrasi tampilan Habit menggunakan data contoh"
    >
      <div className="scene-orbit orbit-one" />
      <div className="scene-orbit orbit-two" />
      <span className="scene-spark spark-one">
        <Icon name="spark" size={25} />
      </span>
      <span className="scene-spark spark-two">
        <Icon name="spark" size={16} />
      </span>
      <div className="preview-browser">
        <div className="browser-bar">
          <span className="browser-dots">
            <i />
            <i />
            <i />
          </span>
          <span>
            <Icon name="lock" size={10} /> habit.senlabs.web.id
          </span>
          <Icon name="arrow-up" size={11} />
        </div>
        <div className="mini-app">
          <aside className="mini-sidebar">
            <Image src="/brand/habit-mark.svg" alt="" width={30} height={30} />
            <span className="mini-nav-active">
              <Icon name="calendar" size={17} />
            </span>
            <Icon name="task" size={17} />
            <Icon name="wallet" size={17} />
            <Icon name="baby" size={17} />
            <Icon name="photo" size={17} />
            <span className="mini-avatar">N</span>
          </aside>
          <div className="mini-main">
            <div className="mini-topline">
              <span>RUANG KELUARGA KITA</span>
              <span className="mini-people">
                <i>N</i>
                <i>B</i>
                <i>A</i>
              </span>
            </div>
            <div className="mini-hero">
              <div>
                <span className="mini-eyebrow">Senin yang menyenangkan</span>
                <p>
                  Selamat pagi,
                  <br />
                  <strong>Keluarga Pratama.</strong>
                </p>
                <span>Cek agenda dan tugas keluarga hari ini.</span>
              </div>
              <Image
                src="/illustrations/family-banner-v3.webp"
                alt=""
                width={280}
                height={120}
                priority
                className="mini-family"
              />
            </div>
            <div className="mini-stats">
              <div>
                <span className="mini-icon mint">
                  <Icon name="task" size={15} />
                </span>
                <span>
                  Tugas hari ini<strong>3 tugas</strong>
                </span>
              </div>
              <div>
                <span className="mini-icon peach">
                  <Icon name="calendar" size={15} />
                </span>
                <span>
                  Agenda bersama<strong>2 agenda</strong>
                </span>
              </div>
            </div>
            <div className="mini-sections">
              <div className="mini-tasks">
                <h3>
                  Berbagi peran
                  <Icon name="heart" size={12} />
                </h3>
                <div>
                  <span className="tiny-check">
                    <Icon name="check" size={9} />
                  </span>
                  <span>
                    Siapkan bekal sekolah<small>Sudah selesai</small>
                  </span>
                  <i className="person peach-person">N</i>
                </div>
                <div>
                  <span className="tiny-check empty" />
                  <span>
                    Belanja kebutuhan rumah<small>Hari ini · 16.00</small>
                  </span>
                  <i className="person mint-person">B</i>
                </div>
                <div>
                  <span className="tiny-check empty" />
                  <span>
                    Rapikan mainan<small>Waktu bersama si kecil</small>
                  </span>
                  <i className="person lavender-person">A</i>
                </div>
              </div>
              <div className="mini-calendar">
                <h3>
                  November<span>‹ &nbsp; ›</span>
                </h3>
                <div className="mini-days">
                  {["S", "S", "R", "K", "J", "S", "M"].map((d, i) => (
                    <b key={i}>{d}</b>
                  ))}
                  {Array.from({ length: 21 }, (_, i) => (
                    <span
                      key={i}
                      className={
                        i === 15 ? "is-selected" : i === 18 ? "has-dot" : ""
                      }
                    >
                      {i + 1}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="preview-caption">
          <span className="live-dot" />
          Contoh agenda dan pembagian tugas.<span>DATA CONTOH</span>
        </div>
      </div>
      <div className="floating-note">
        <span className="floating-check">
          <Icon name="check" size={18} />
        </span>
        <div>
          <strong>Bekal sudah disiapkan.</strong>
          <span>Satu tugas keluarga selesai.</span>
        </div>
        <Icon name="heart" size={15} />
      </div>
      <div className="floating-calendar">
        <span className="calendar-sticker-month">NOV</span>
        <strong>16</strong>
        <span>
          Waktunya
          <br />
          bersama.
        </span>
      </div>
    </div>
  );
}
