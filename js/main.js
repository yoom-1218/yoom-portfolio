/* 포트폴리오 공통 동작 */
(function ($) {
  "use strict";
  $(function () {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    // 모바일 기준: css/style.css의 "@media (max-width: 767px)"와 같은 값으로 유지
    const mobile = window.matchMedia("(max-width: 767px)");
    const $header = $(".site-header");
    const $toggle = $(".site-header__toggle");
    const $nav = $("#primary-nav");
    let opener = null;
    let activeDialog = null;
    let menuOpen = false;

    // 모바일 메뉴 열기·닫기
    function closeMenu(returnFocus) {
      menuOpen = false;
      $toggle.attr({ "aria-expanded": "false", "aria-label": "메뉴 열기" });
      $nav.prop("hidden", mobile.matches);
      $("body").removeClass("is-menu-open");
      if (returnFocus && mobile.matches) $toggle.trigger("focus");
    }
    function syncMenu() {
      $header.toggleClass("site-header--enhanced", mobile.matches);
      $toggle.prop("hidden", !mobile.matches);
      closeMenu(false);
    }
    if ($nav.length) {
      syncMenu();
      if (mobile.addEventListener) mobile.addEventListener("change", syncMenu);
      else mobile.addListener(syncMenu);
      $toggle.on("click", function () {
        menuOpen = !menuOpen;
        $(this).attr({
          "aria-expanded": String(menuOpen),
          "aria-label": menuOpen ? "메뉴 닫기" : "메뉴 열기",
        });
        $nav.prop("hidden", !menuOpen);
        $("body").toggleClass("is-menu-open", menuOpen);
      });
    }
    $(document).on("keydown", function (event) {
      if (event.key === "Escape" && menuOpen) closeMenu(true);
    });
    // 모바일 메뉴 키보드 포커스 순환
    $header.on("keydown", function (event) {
      if (!menuOpen || event.key !== "Tab") return;
      const nodes = [$toggle[0]].concat($nav.find("a").get());
      const first = nodes[0],
        last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    // 페이지 내부 부드러운 이동
    $('a[href^="#"]').on("click", function (event) {
      const id = this.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;
      event.preventDefault();
      if (menuOpen) closeMenu(false);
      const top =
        target.getBoundingClientRect().top + window.scrollY - ($header.outerHeight() || 0) - 16;
      const done = function () {
        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
          $(target).one("blur", function () {
            this.removeAttribute("tabindex");
          });
        }
        target.focus({ preventScroll: true });
        history.replaceState(null, "", "#" + id);
      };
      if (reducedMotion.matches) {
        window.scrollTo(0, top);
        done();
      } else
        $("html, body").stop(true).animate({ scrollTop: top }, 550, "swing").promise().done(done);
    });

    // 프로젝트 요약 모달 열기 (미지원 브라우저는 상세 링크로 이동)
    $("[data-project]").on("click", function (event) {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const dialog = document.getElementById("modal-" + $(this).data("project"));
      if (!dialog || typeof dialog.showModal !== "function") return;
      event.preventDefault();
      opener = this;
      activeDialog = dialog;
      dialog.showModal();
      $("body").addClass("is-modal-open");
      $(dialog).find(".modal__title").trigger("focus");
    });
    function closeDialog() {
      if (activeDialog && activeDialog.open) activeDialog.close();
    }
    $("[data-close]").on("click", closeDialog);
    $("dialog")
      .on("click", function (event) {
        // 모달 바깥 클릭 시 닫기
        if (event.target !== this) return;
        const r = this.getBoundingClientRect();
        if (
          event.clientX < r.left ||
          event.clientX > r.right ||
          event.clientY < r.top ||
          event.clientY > r.bottom
        )
          this.close();
      })
      .on("close", function () {
        $("body").removeClass("is-modal-open");
        activeDialog = null;
        if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
        opener = null;
      })
      .on("keydown", function (event) {
        // 모달 키보드 포커스 순환
        if (event.key !== "Tab") return;
        const nodes = $(this).find('a[href],button:not(:disabled),[tabindex="0"]').get();
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement.classList.contains("modal__title"))
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });

    // 이메일 복사 및 미지원 환경 처리
    $("[data-copy]").on("click", async function () {
      const value = $(this).attr("data-copy");
      try {
        if (!navigator.clipboard || !window.isSecureContext)
          throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(value);
        $("#live-status").text("이메일 주소를 복사했습니다.");
        const $btn = $(this).text("복사 완료");
        window.setTimeout(function () {
          $btn.text("이메일 복사");
        }, 2200);
      } catch (error) {
        const node = document.querySelector(".contact__value");
        const range = document.createRange();
        range.selectNodeContents(node);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        $("#live-status").text(
          "자동 복사가 지원되지 않아 이메일을 선택했습니다. 복사 단축키를 사용해 주세요.",
        );
      }
    });

    // 스크롤 등장 효과
    const $reveals = $(".reveal");
    $reveals.on("focusin", function () {
      $(this).removeClass("reveal--pending");
    });
    let revealObserver;
    if ("IntersectionObserver" in window && !reducedMotion.matches) {
      revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              $(entry.target).removeClass("reveal--pending");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.08 },
      );
      $reveals.each(function () {
        // 첫 화면 콘텐츠는 숨기지 않음
        if (this.getBoundingClientRect().top > window.innerHeight)
          $(this).addClass("reveal--pending");
        $(this).addClass("reveal--ready");
        revealObserver.observe(this);
      });
    }
    function revealAll() {
      $reveals.removeClass("reveal--pending");
      if (revealObserver) revealObserver.disconnect();
    }
    if (reducedMotion.addEventListener)
      reducedMotion.addEventListener("change", function () {
        if (reducedMotion.matches) revealAll();
      });
    $(window).on("pageshow", function () {
      if (reducedMotion.matches) revealAll();
    });

    // 스크롤 위치에 따른 메뉴 강조
    let scheduled = false;
    const sections = ["work", "publishing", "about", "workflow", "contact"];
    function updateHeader() {
      scheduled = false;
      $header.toggleClass("site-header--scrolled", window.scrollY > 16);
      let current = "";
      sections.forEach(function (id) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 160) current = id;
      });
      // 페이지 맨 아래에서는 마지막 Contact 메뉴를 강조합니다.
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && document.getElementById("contact")) current = "contact";
      $(".nav__link").each(function () {
        if (this.hash === "#" + current) $(this).attr("aria-current", "location");
        else $(this).removeAttr("aria-current");
      });
    }
    window.addEventListener(
      "scroll",
      function () {
        if (!scheduled) {
          scheduled = true;
          requestAnimationFrame(updateHeader);
        }
      },
      { passive: true },
    );
    updateHeader();
  });
})(jQuery);
