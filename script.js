document.addEventListener("DOMContentLoaded", () => {
  if (window.lucide) {
    window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const videos = Array.from(document.querySelectorAll("video.auto-video"));

  videos.forEach((video) => {
    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;
    video.autoplay = false;

    if (!video.hasAttribute("controls")) {
      const card = video.closest("article, figure");
      const label = card?.querySelector("h3, figcaption")?.textContent?.trim() || "WorldParticle simulation";
      video.setAttribute("aria-label", `${label} video. Autoplays silently and loops.`);
    }
  });

  const preloadObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const video = entry.target;
            video.preload = "auto";
            video.load();
            observer.unobserve(video);
          });
        },
        { rootMargin: "100% 0px", threshold: 0 }
      )
    : null;

  const playbackObserver = "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) => {
          let playIndex = 0;
          entries.forEach((entry) => {
            const video = entry.target;
            if (entry.isIntersecting) {
              const delay = playIndex * 50;
              playIndex += 1;
              window.setTimeout(() => {
                if (video.getBoundingClientRect().bottom > 0 && video.getBoundingClientRect().top < window.innerHeight) {
                  video.play().catch(() => {});
                }
              }, delay);
            } else {
              video.pause();
            }
          });
        },
        { threshold: 0 }
      )
    : null;

  videos.forEach((video) => {
    if (video.classList.contains("hero-video")) {
      video.preload = "auto";
    } else {
      video.preload = "none";
      preloadObserver?.observe(video);
    }
    playbackObserver?.observe(video);
  });

  if (!playbackObserver) {
    videos[0]?.play().catch(() => {});
  }

  document.querySelectorAll("[data-sync-group]").forEach((group) => {
    const syncedVideos = Array.from(group.querySelectorAll("video"));
    if (syncedVideos.length < 2) return;

    const [leader, ...followers] = syncedVideos;
    let lock = false;

    const sync = (action) => {
      if (lock) return;
      lock = true;
      followers.forEach((video) => {
        if (Math.abs(video.currentTime - leader.currentTime) > 0.12) {
          video.currentTime = leader.currentTime;
        }
        if (action === "play") video.play().catch(() => {});
        if (action === "pause") video.pause();
      });
      window.setTimeout(() => {
        lock = false;
      }, 60);
    };

    leader.addEventListener("play", () => sync("play"));
    leader.addEventListener("pause", () => sync("pause"));
    leader.addEventListener("seeked", () => sync("seek"));
    window.setInterval(() => {
      if (!leader.paused) sync("seek");
    }, 1000);
  });

  const reveals = Array.from(document.querySelectorAll(".reveal"));
  if (!reduceMotion && "IntersectionObserver" in window) {
    reveals.forEach((element) => element.classList.add("is-ready"));
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    reveals.forEach((element) => revealObserver.observe(element));
  }

  const sectionLinks = Array.from(document.querySelectorAll(".nav-links a"));
  const linkedSections = sectionLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          sectionLinks.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
          });
        });
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 }
    );
    linkedSections.forEach((section) => sectionObserver.observe(section));
  }

  const copyButton = document.getElementById("copy-bibtex");
  const bibtex = document.querySelector("#bibtex code");
  copyButton?.addEventListener("click", async () => {
    const text = bibtex?.textContent?.trim() || "";
    let copied = false;

    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      copied = document.execCommand("copy");
      textarea.remove();
    }

    if (copied) {
      const label = copyButton.querySelector("span");
      const original = label.textContent;
      label.textContent = "Copied";
      copyButton.classList.add("copied");
      window.setTimeout(() => {
        label.textContent = original;
        copyButton.classList.remove("copied");
      }, 1800);
    }
  });
});
