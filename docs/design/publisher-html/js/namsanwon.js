(function () {
  var menuButton = document.querySelector('[data-menu-button]');
  var nav = document.querySelector('[data-nav]');
  var header = document.querySelector('[data-header]');
  var sitemapButton = document.querySelector('[data-sitemap-button]');
  var sitemapDropdown = document.querySelector('[data-sitemap-dropdown]');

  if (!nav) return;

  function markCurrentNav() {
    var currentSection = document.body.dataset.currentSection;
    var currentPage = document.body.dataset.currentPage;
    var currentPath = decodeURIComponent(window.location.pathname.split('/').pop() || '');

    nav.querySelectorAll('.navItem').forEach(function (item) {
      var trigger = item.querySelector('.navTrigger');
      var links = Array.prototype.slice.call(item.querySelectorAll('.subMenu a'));
      var isCurrent = false;

      links.forEach(function (link) {
        var href = link.getAttribute('href') || '';
        var linkPage = href.replace(/^\.\//, '');
        var itemSection = item.dataset.section;
        if (linkPage === currentPage || linkPage === currentPath || itemSection === currentSection) {
          isCurrent = true;
        }
      });

      item.classList.toggle('isCurrent', isCurrent);
      if (trigger) {
        if (isCurrent) {
          trigger.setAttribute('aria-current', 'page');
        } else {
          trigger.removeAttribute('aria-current');
        }
      }
    });
  }

  var sectionMap = {
    '남산원소개': 'about',
    '사업소개': 'business',
    '후원/자원봉사': 'support',
    '아동생활': 'children',
    '커뮤니티': 'community'
  };

  nav.querySelectorAll('.navItem').forEach(function (item) {
    var trigger = item.querySelector('.navTrigger');
    if (!trigger) return;
    item.dataset.section = sectionMap[trigger.textContent.trim()] || '';
  });

  markCurrentNav();

  function scrollCurrentLocalNav() {
    var localNav = document.querySelector('.localNavInner');
    if (!localNav) return;

    var activeLink = localNav.querySelector('a.isActive, a[aria-current="page"]');
    if (!activeLink) return;

    var targetLeft = activeLink.offsetLeft - ((localNav.clientWidth - activeLink.offsetWidth) / 2);
    var maxScrollLeft = localNav.scrollWidth - localNav.clientWidth;
    var nextScrollLeft = Math.max(0, Math.min(targetLeft, maxScrollLeft));

    if (typeof localNav.scrollTo === 'function') {
      localNav.scrollTo({
        left: nextScrollLeft,
        top: 0,
        behavior: 'auto'
      });
    } else {
      localNav.scrollLeft = nextScrollLeft;
    }
  }

  function queueScrollCurrentLocalNav() {
    scrollCurrentLocalNav();
    window.setTimeout(scrollCurrentLocalNav, 0);
    window.setTimeout(scrollCurrentLocalNav, 120);
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(scrollCurrentLocalNav);
    }
  }

  queueScrollCurrentLocalNav();

  window.addEventListener('load', queueScrollCurrentLocalNav);
  window.addEventListener('resize', queueScrollCurrentLocalNav);
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(queueScrollCurrentLocalNav);
  }

  function closeSubMenus(exceptItem) {
    nav.querySelectorAll('.navItem.isOpen').forEach(function (item) {
      if (item === exceptItem) return;
      item.classList.remove('isOpen');
      var trigger = item.querySelector('.navTrigger');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function closeSitemap() {
    if (!sitemapButton || !sitemapDropdown) return;
    sitemapDropdown.classList.remove('isOpen');
    if (header) header.classList.remove('isSitemapOpen');
    sitemapButton.setAttribute('aria-expanded', 'false');
    sitemapButton.setAttribute('aria-label', '사이트맵 열기');
  }

  if (menuButton) {
    menuButton.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('isOpen');
      menuButton.setAttribute('aria-expanded', String(isOpen));
      if (!isOpen) closeSubMenus();
      closeSitemap();
    });
  }

  if (sitemapButton && sitemapDropdown) {
    sitemapButton.addEventListener('click', function () {
      var isOpen = !sitemapDropdown.classList.contains('isOpen');
      closeSubMenus();
      sitemapDropdown.classList.toggle('isOpen', isOpen);
      if (header) header.classList.toggle('isSitemapOpen', isOpen);
      sitemapButton.setAttribute('aria-expanded', String(isOpen));
      sitemapButton.setAttribute('aria-label', isOpen ? '사이트맵 닫기' : '사이트맵 열기');
      if (isOpen) {
        nav.classList.remove('isOpen');
        if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
      }
    });

    sitemapDropdown.addEventListener('click', function (event) {
      if (event.target.tagName !== 'A') return;
      closeSitemap();
    });
  }

  nav.querySelectorAll('.navTrigger').forEach(function (trigger) {
    trigger.addEventListener('click', function () {
      var item = trigger.closest('.navItem');
      var isOpen = !item.classList.contains('isOpen');
      closeSitemap();
      closeSubMenus(item);
      item.classList.toggle('isOpen', isOpen);
      trigger.setAttribute('aria-expanded', String(isOpen));
    });
  });

  nav.addEventListener('click', function (event) {
    if (event.target.tagName !== 'A') return;
    nav.classList.remove('isOpen');
    if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
    closeSubMenus();
    closeSitemap();
  });

  document.addEventListener('click', function (event) {
    if (nav.contains(event.target)) return;
    if (sitemapButton && sitemapButton.contains(event.target)) return;
    if (sitemapDropdown && sitemapDropdown.contains(event.target)) return;
    closeSubMenus();
    closeSitemap();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    closeSubMenus();
    closeSitemap();
    nav.classList.remove('isOpen');
    if (menuButton) menuButton.setAttribute('aria-expanded', 'false');
  });

  window.addEventListener('scroll', function () {
    if (!header) return;
    header.classList.toggle('isScrolled', window.scrollY > 8);
  }, { passive: true });

  var boardTabs = document.querySelectorAll('[data-board-tab]');
  var boardList = document.querySelector('[data-board-list]');
  var boardMore = document.querySelector('.boardHeader .moreButton');

  var boardData = {
    notice: {
      moreHref: './notice.html',
      moreLabel: '공지사항 더보기',
      items: [
        { title: '2024년 상반기 자원봉사자 정기 교육 안내', date: '2024.05.20', isNew: true },
        { title: '남산원 아이들의 여름 캠프 후원 감사 인사', date: '2024.05.15', isNew: true },
        { title: '시설 보수 공사 입찰 공고 (급식실 환경개선)', date: '2024.05.10' },
        { title: '개인정보 처리방침 개정 안내 (2024년 5월)', date: '2024.05.05' },
        { title: '제54회 남산원 후원의 밤 행사 초대장', date: '2024.04.28' }
      ]
    },
    budget: {
      moreHref: './budget.html',
      moreLabel: '예산게시판 더보기',
      items: [
        { title: '(예산) 2024년 남산원 1차 추가경정 예산 공고', date: '2024.05.24', isNew: true },
        { title: '(예산) 2024년 법인회계 예산서 공개', date: '2024.05.18', isNew: true },
        { title: '(예산) 2023년 세입·세출 결산 보고', date: '2024.05.12' },
        { title: '(예산) 시설 기능보강 사업 예산 집행 안내', date: '2024.05.06' },
        { title: '(예산) 후원금 수입 및 사용 결과 공지', date: '2024.04.30' }
      ]
    },
    qna: {
      moreHref: './qna.html',
      moreLabel: '질문과 답변 더보기',
      items: [
        { title: '질문 자원봉사 신청 절차가 궁금합니다', date: '2024.05.23', isNew: true },
        { title: '질문 후원금 영수증 발급은 어떻게 하나요?', date: '2024.05.17', isNew: true },
        { title: '질문 물품 후원 가능 품목을 알고 싶습니다', date: '2024.05.11' },
        { title: '질문 기관 방문 상담 예약이 가능한가요?', date: '2024.05.04' },
        { title: '질문 정기후원 CMS 변경 방법 문의', date: '2024.04.27' }
      ]
    }
  };

  function toDateTime(dateText) {
    return dateText.replace(/\./g, '-');
  }

  function renderBoard(type) {
    if (!boardList || !boardData[type]) return;

    boardList.innerHTML = boardData[type].items.map(function (item) {
      var badge = item.isNew ? '<em class="badgeNew">N</em>' : '';
      return '' +
        '<li>' +
          '<a href="./notice-detail.html"><span>' + item.title + '</span>' + badge + '</a>' +
          '<time datetime="' + toDateTime(item.date) + '">' + item.date + '</time>' +
        '</li>';
    }).join('');

    if (boardMore) {
      boardMore.setAttribute('href', boardData[type].moreHref);
      boardMore.setAttribute('aria-label', boardData[type].moreLabel);
    }
  }

  if (boardTabs.length && boardList) {
    renderBoard('notice');

    boardTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var type = tab.getAttribute('data-board-tab');
        boardTabs.forEach(function (button) {
          button.classList.toggle('isActive', button === tab);
          button.setAttribute('aria-selected', String(button === tab));
          button.removeAttribute('id');
        });
        tab.setAttribute('id', 'boardTitle');
        boardList.setAttribute('aria-labelledby', 'boardTitle');
        renderBoard(type);
      });
    });
  }

  var noticeBoardList = document.querySelector('[data-notice-board-list]');
  var noticeBoardPagination = document.querySelector('[data-notice-pagination]');
  var noticeBoardEmpty = document.querySelector('[data-notice-empty]');
  var noticeBoardFilterButtons = Array.prototype.slice.call(document.querySelectorAll('[data-notice-filter]'));
  var noticeBoardSearch = document.querySelector('[data-notice-search]');
  var noticePullHint = document.querySelector('[data-notice-pull-hint]');
  var noticeMobileLoader = document.querySelector('[data-notice-mobile-loader]');
  var noticeMobileQuery = window.matchMedia('(max-width: 820px)');

  var noticeBoardKind = noticeBoardList ? noticeBoardList.getAttribute('data-board-kind') || 'notice' : 'notice';
  var isFreeBoard = noticeBoardKind === 'free';
  var isChildLifeBoard = noticeBoardKind === 'child';

  var noticeBoardItems = [
    { type: 'notice', label: '공지', title: '속 4월 20일 남산원 홈페이지 오픈', date: '2024.01.02', views: '1,240', pinned: true, isNew: true, hasFile: true },
    { type: 'notice', label: '공지', title: '개인정보로 인하여 아동의 사진, 영상은 모자이크 또는 게시되지 않습니다.', date: '2023.12.15', views: '856', pinned: true, isNew: true, hasImage: true },
    { type: 'notice', label: '공지', title: '개인정보로 인하여 아동의 사진, 영상은 모자이크 또는 게시되지 않습니다.', date: '2023.12.15', views: '856', pinned: true, hasFile: true, hasImage: true },
    { type: 'general', label: '', title: '2023년 하반기 외부회계감사 결과 공시', date: '2023.12.28', views: '342' },
    { type: 'general', label: '', title: '남산원 생활지도원 정규직 채용 최종 합격자 발표', date: '2023.12.24', views: '518' },
    { type: 'general', label: '', title: '제 4회 남산원 후원자의 밤 따뜻한 동행 초대장', date: '2023.12.20', views: '275' },
    { type: 'general', label: '', title: '사회복지시설 경영공시 (2023년 3분기)', date: '2023.12.18', views: '156' },
    { type: 'general', label: '', title: '동절기 자원봉사자 상시 모집 안내', date: '2023.12.12', views: '482' },
    { type: 'general', label: '', title: '남산원 생활관 환경개선 공사 안내', date: '2023.12.10', views: '301' },
    { type: 'corporation', label: '법인', title: '사회복지법인 남산원 이사회 회의록 공개', date: '2023.12.08', views: '239' },
    { type: 'budget', label: '예산', title: '2024년 법인회계 예산서 공개', date: '2023.12.05', views: '427' },
    { type: 'notice', label: '공지', title: '자원봉사 활동 신청 전 확인사항 안내', date: '2023.12.01', views: '318' },
    { type: 'settlement', label: '결산', title: '후원금 수입 및 사용 결과 보고', date: '2023.11.28', views: '293' },
    { type: 'corporation', label: '법인', title: '법인 정관 변경 관련 공지사항', date: '2023.11.24', views: '184' },
    { type: 'notice', label: '공지', title: '시설 안전점검에 따른 방문 일정 조정 안내', date: '2023.11.20', views: '376' },
    { type: 'budget', label: '예산', title: '기능보강 사업 예산 집행 안내', date: '2023.11.17', views: '205' },
    { type: 'notice', label: '공지', title: '남산원 후원자 개인정보 처리방침 개정 안내', date: '2023.11.14', views: '467' },
    { type: 'settlement', label: '결산', title: '2023년 시설회계 결산서 공개', date: '2023.11.10', views: '221' },
    { type: 'corporation', label: '법인', title: '법인 임원 선임 결과 공고', date: '2023.11.06', views: '198' },
    { type: 'notice', label: '공지', title: '남산원 행사 일정 변경 안내', date: '2023.11.02', views: '359' },
    { type: 'general', label: '', title: '홈페이지 이용 관련 임시 점검 안내', date: '2023.10.31', views: '147' },
    { type: 'budget', label: '예산', title: '2023년 후원금 예산 집행 내역 안내', date: '2023.10.30', views: '288' },
    { type: 'notice', label: '공지', title: '추석 연휴 시설 방문 안내', date: '2023.10.26', views: '312' },
    { type: 'settlement', label: '결산', title: '법인회계 세입 세출 결산서 공개', date: '2023.10.22', views: '176' },
    { type: 'corporation', label: '법인', title: '사회복지법인 공시자료 안내', date: '2023.10.18', views: '264' },
    { type: 'budget', label: '예산', title: '2023년 남산원 본예산 공고', date: '2023.10.14', views: '405' },
    { type: 'notice', label: '공지', title: '정기후원 CMS 신청 안내', date: '2023.10.10', views: '529' }
  ];

  var freeBoardItems = [
    { title: '후원 물품 문의드립니다.', author: '박준영', date: '2023.12.28', status: '답변완료', views: '1', isNew: true, hasImage: true },
    { title: '후원 문의', author: '박준영', date: '2023.12.28', status: '접수완료', views: '7', locked: true, hasFile: true },
    { title: '안녕하세요. 동아리 Green Lantern 입니다!', author: '박준영', date: '2023.12.28', status: '접수완료', views: '2' },
    { title: '주말 봉사활동 문의드립니다.', author: '박준영', date: '2023.12.28', status: '접수완료', views: '30', isNew: true, locked: true, hasFile: true, hasImage: true },
    { title: '봉사문의합니다.', author: '박준영', date: '2023.12.28', status: '접수완료', views: '10', hasFile: true },
    { title: '후원 문의', author: '박준영', date: '2023.12.28', status: '접수완료', views: '5', locked: true },
    { title: '봉사활동 문의', author: '박준영', date: '2023.12.28', status: '접수완료', views: '5' },
    { title: '소득공제 관련', author: '박준영', date: '2023.12.28', status: '접수완료', views: '1,307', hasFile: true },
    { title: '정기 후원 문의드립니다.', author: '박준영', date: '2023.12.28', status: '접수완료', views: '1,307' },
    { title: '자원봉사 신청 일정 문의', author: '김민지', date: '2023.12.24', status: '답변완료', views: '128', hasImage: true },
    { title: '후원확인서 발급 요청드립니다.', author: '이서준', date: '2023.12.21', status: '접수완료', views: '94', locked: true, hasFile: true },
    { title: '방문 봉사 가능 시간 문의', author: '최유진', date: '2023.12.18', status: '답변완료', views: '76' },
    { title: 'CMS 후원 변경 문의', author: '정현우', date: '2023.12.14', status: '답변완료', views: '153', hasFile: true },
    { title: '아이들 물품 후원 관련 문의', author: '윤하늘', date: '2023.12.11', status: '접수완료', views: '61', hasImage: true },
    { title: '봉사활동 확인서 문의', author: '한지민', date: '2023.12.08', status: '답변완료', views: '118', locked: true },
    { title: '단체 자원봉사 신청 문의', author: '오세훈', date: '2023.12.05', status: '접수완료', views: '87' },
    { title: '연말 후원 영수증 발급 일정', author: '강수빈', date: '2023.12.01', status: '답변완료', views: '209', hasFile: true },
    { title: '정기후원 해지 절차 문의', author: '문지호', date: '2023.11.28', status: '답변완료', views: '164', locked: true },
    { title: '물품 기부 가능 품목 문의', author: '송예린', date: '2023.11.24', status: '접수완료', views: '132', hasImage: true },
    { title: '주말 방문 가능 여부 문의', author: '임도윤', date: '2023.11.20', status: '답변완료', views: '146' }
  ];

  var freeBoardAdditionalTitles = [
    '후원 신청서 작성 문의',
    '자원봉사 가능 일정 문의',
    '기부금 영수증 발급 요청',
    '단체 방문 절차 문의',
    '물품 후원 전달 방법',
    '정기후원 결제일 변경 문의',
    '봉사활동 시간 인정 문의',
    '후원자 정보 변경 요청'
  ];

  while (freeBoardItems.length < 45) {
    var freeBoardIndex = freeBoardItems.length;
    freeBoardItems.push({
      title: freeBoardAdditionalTitles[freeBoardIndex % freeBoardAdditionalTitles.length],
      author: '방문자' + (freeBoardIndex + 1),
      date: '2023.11.' + String(19 - (freeBoardIndex % 19)).padStart(2, '0'),
      status: freeBoardIndex % 3 === 0 ? '답변완료' : '접수완료',
      views: String(40 + freeBoardIndex * 7),
      locked: freeBoardIndex % 5 === 0,
      hasFile: freeBoardIndex % 7 === 0,
      hasImage: freeBoardIndex % 8 === 0
    });
  }

  var childLifeBoardItems = [
    { type: 'notice', label: '공지', title: '개인정보로 인하여 아동의 사진, 영상은 모자이크 또는 게시되지 않습니다.', author: '관리자', date: '2024.01.02', views: '1,240', pinned: true },
    { type: 'general', label: '', title: '[7월/29회기] 건강보험공단 중구지사 후원 방송댄스 프로그램', author: '성유민', date: '2023.12.28', views: '342', isNew: true, hasImage: true },
    { type: 'general', label: '', title: '6월 28일 모세방 소식입니다.', author: '양현주', date: '2023.12.24', views: '518' },
    { type: 'general', label: '', title: '6월 28일 한나방 소식입니다.', author: '이세랑', date: '2023.12.24', views: '518' },
    { type: 'general', label: '', title: '6월 28일 솔로몬방 소식입니다.', author: '홍예찬', date: '2023.12.24', views: '518' },
    { type: 'general', label: '', title: '6월 28일 다윗방 소식입니다.', author: '오정복', date: '2023.12.20', views: '275' },
    { type: 'general', label: '', title: '6월 26일 다윗방 05월 선행상 수상 소식입니다.', author: '장영호', date: '2023.12.18', views: '156', hasImage: true },
    { type: 'general', label: '', title: '아이들과 함께한 주말 문화활동', author: '김민지', date: '2023.12.12', views: '482', hasFile: true }
  ];

  var childLifeAdditionalTitles = [
    '생활관 생일잔치 소식입니다.',
    '주말 체험학습 활동 소식입니다.',
    '아이들과 함께한 미술 프로그램',
    '여름철 건강관리 교육 소식',
    '자립지원 요리 프로그램 활동',
    '학교 방과후 활동 소식입니다.',
    '남산 산책 프로그램을 진행했습니다.',
    '독서 활동과 함께한 즐거운 오후'
  ];

  while (childLifeBoardItems.length < 36) {
    var childLifeIndex = childLifeBoardItems.length;
    childLifeBoardItems.push({
      type: 'general',
      label: '',
      title: childLifeAdditionalTitles[childLifeIndex % childLifeAdditionalTitles.length],
      author: '생활지도원',
      date: '2023.11.' + String(28 - (childLifeIndex % 20)).padStart(2, '0'),
      views: String(90 + childLifeIndex * 13),
      hasImage: childLifeIndex % 5 === 0,
      hasFile: childLifeIndex % 7 === 0
    });
  }

  var activeBoardItems = isFreeBoard
    ? freeBoardItems
    : isChildLifeBoard
      ? childLifeBoardItems
      : noticeBoardItems;

  var noticeBoardState = {
    filters: [],
    searchType: 'all',
    keyword: '',
    page: 1,
    pageSize: isFreeBoard ? 9 : 8,
    mobileVisibleCount: 0,
    isMobileLoading: false,
    touchStartY: 0
  };

  function getNoticeBoardFilteredItems() {
    return activeBoardItems.filter(function (item) {
      var matchesFilter = noticeBoardState.filters.length === 0 || noticeBoardState.filters.indexOf(item.type) !== -1;
      var keyword = noticeBoardState.keyword.trim().toLowerCase();
      var searchableText = item.title + ' ' + (item.label || '') + ' ' + (item.author || '');
      var matchesType = noticeBoardState.searchType === 'all'
        || (noticeBoardState.searchType === 'title' && item.title.toLowerCase().indexOf(keyword) !== -1)
        || (noticeBoardState.searchType === 'author' && (item.author || '').toLowerCase().indexOf(keyword) !== -1)
        || item.type === noticeBoardState.searchType;
      var matchesKeyword = !keyword || searchableText.toLowerCase().indexOf(keyword) !== -1;
      return matchesFilter && matchesType && matchesKeyword;
    });
  }

  function getNoticeNumber(total, index) {
    return total - index;
  }

  function renderBoardStatusIcons(item) {
    return '' +
      (item.isNew ? '<span class="noticeBoardStatusIcon isNew" aria-label="새 게시물"></span>' : '') +
      (item.locked ? '<span class="noticeBoardStatusIcon isLocked" aria-label="비밀 게시물"></span>' : '') +
      (item.hasFile ? '<span class="noticeBoardStatusIcon hasFile" aria-label="파일 첨부"></span>' : '') +
      (item.hasImage ? '<span class="noticeBoardStatusIcon hasImage" aria-label="이미지 첨부"></span>' : '');
  }

  function renderNoticeBoardRow(item, regularItems) {
    var regularIndex = regularItems.indexOf(item);
    var number = item.pinned ? '' : getNoticeNumber(regularItems.length, regularIndex);
    var numberContent = item.pinned ? '<span class="noticeBoardPin"><span class="blind">상단 고정</span></span>' : number;
    var label = item.label ? '<em class="noticeBoardCategory">' + item.label + '</em>' : '';
    return '' +
      '<article class="noticeBoardRow' + (item.pinned ? ' isPinned' : '') + '">' +
        '<span class="noticeBoardNumber">' + numberContent + '</span>' +
        '<a class="noticeBoardTitle" href="./notice-detail.html">' + label + '<span>' + item.title + '</span><span class="noticeBoardStatusIcons">' + renderBoardStatusIcons(item) + '</span></a>' +
        '<time datetime="' + item.date + '">' + item.date + '</time>' +
        '<span class="noticeBoardViews">' + item.views + '</span>' +
      '</article>';
  }

  function renderFreeBoardRow(item, regularItems) {
    var regularIndex = regularItems.indexOf(item);
    var number = getNoticeNumber(regularItems.length, regularIndex);
    var statusClass = item.status === '답변완료' ? ' isAnswered' : '';
    var secretAttributes = item.locked ? ' data-secret-post aria-haspopup="dialog"' : '';
    return '' +
      '<article class="noticeBoardRow freeBoardRow">' +
        '<span class="noticeBoardNumber">' + number + '</span>' +
        '<a class="noticeBoardTitle" href="./free-board-detail.html?post=' + number + '"' + secretAttributes + '><span>' + item.title + '</span><span class="noticeBoardStatusIcons">' + renderBoardStatusIcons(item) + '</span></a>' +
        '<span class="freeBoardAuthor">' + item.author + '</span>' +
        '<time datetime="' + item.date + '">' + item.date + '</time>' +
        '<span class="freeBoardStatus' + statusClass + '">' + item.status + '</span>' +
        '<span class="noticeBoardViews">' + item.views + '</span>' +
      '</article>';
  }

  function renderChildLifeBoardRow(item, regularItems) {
    var regularIndex = regularItems.indexOf(item);
    var number = item.pinned ? '' : getNoticeNumber(regularItems.length, regularIndex);
    var numberContent = item.pinned ? '<span class="noticeBoardPin"><span class="blind">상단 고정</span></span>' : number;
    var label = item.label ? '<em class="noticeBoardCategory">' + item.label + '</em>' : '';
    var postId = item.pinned ? 'pinned' : number;
    return '' +
      '<article class="noticeBoardRow childLifeBoardRow' + (item.pinned ? ' isPinned' : '') + '">' +
        '<span class="noticeBoardNumber">' + numberContent + '</span>' +
        '<a class="noticeBoardTitle" href="./child-life-detail.html?post=' + postId + '">' + label + '<span>' + item.title + '</span><span class="noticeBoardStatusIcons">' + renderBoardStatusIcons(item) + '</span></a>' +
        '<span class="childLifeBoardAuthor">' + item.author + '</span>' +
        '<time datetime="' + item.date + '">' + item.date + '</time>' +
        '<span class="noticeBoardViews">' + item.views + '</span>' +
      '</article>';
  }

  function isNearNoticePageBottom() {
    return window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24;
  }

  function syncNoticeMobileControls(hasMore) {
    var isMobile = noticeMobileQuery.matches;
    if (noticeBoardPagination) noticeBoardPagination.hidden = isMobile;
    if (noticePullHint) noticePullHint.hidden = !isMobile || noticeBoardState.isMobileLoading || !hasMore;
    if (noticeMobileLoader && !noticeBoardState.isMobileLoading) noticeMobileLoader.hidden = true;
  }

  function renderNoticeBoard() {
    if (!noticeBoardList) return;

    var filteredItems = getNoticeBoardFilteredItems();
    var pinnedItems = filteredItems.filter(function (item) { return item.pinned; });
    var regularItems = filteredItems.filter(function (item) { return !item.pinned; });
    var isMobile = noticeMobileQuery.matches;
    var regularPageSize = Math.max(1, noticeBoardState.pageSize - pinnedItems.length);
    if (isMobile && noticeBoardState.mobileVisibleCount === 0) {
      noticeBoardState.mobileVisibleCount = regularPageSize;
    }
    var totalPages = Math.max(1, Math.ceil(regularItems.length / regularPageSize));
    if (noticeBoardState.page > totalPages) noticeBoardState.page = totalPages;

    var start = (noticeBoardState.page - 1) * regularPageSize;
    var visibleRegularItems = isMobile
      ? regularItems.slice(0, noticeBoardState.mobileVisibleCount)
      : regularItems.slice(start, start + regularPageSize);
    var visibleItems = pinnedItems.concat(visibleRegularItems);
    var hasMoreMobileItems = isMobile && noticeBoardState.mobileVisibleCount < regularItems.length;

    if (!visibleItems.length) {
      noticeBoardList.innerHTML = '';
      if (noticeBoardEmpty) noticeBoardEmpty.hidden = false;
    } else {
      if (noticeBoardEmpty) noticeBoardEmpty.hidden = true;
      noticeBoardList.innerHTML = '' +
        '<div class="noticeBoardHead' + (isFreeBoard ? ' freeBoardHead' : isChildLifeBoard ? ' childLifeBoardHead' : '') + '" aria-hidden="true">' +
          (isFreeBoard
            ? '<span>번호</span><span>제목</span><span>작성자</span><span>작성일</span><span>처리현황</span><span>조회수</span>'
            : isChildLifeBoard
              ? '<span>번호</span><span>제목</span><span>작성자</span><span>작성일</span><span>조회수</span>'
              : '<span>번호</span><span>제목</span><span>작성일</span><span>조회수</span>') +
        '</div>' +
        visibleItems.map(function (item) {
          return isFreeBoard
            ? renderFreeBoardRow(item, regularItems)
            : isChildLifeBoard
              ? renderChildLifeBoardRow(item, regularItems)
              : renderNoticeBoardRow(item, regularItems);
        }).join('');
    }

    if (!noticeBoardPagination) return;
    var pageButtons = Array.from({ length: totalPages }, function (_, index) {
      var page = index + 1;
      return '<button class="' + (page === noticeBoardState.page ? 'isActive' : '') + '" type="button" data-notice-page="' + page + '" aria-label="' + page + '페이지" aria-current="' + (page === noticeBoardState.page ? 'page' : 'false') + '">' + page + '</button>';
    }).join('');
    noticeBoardPagination.innerHTML = '' +
      '<button class="noticeBoardPageArrow isPrev" type="button" data-notice-page="' + Math.max(1, noticeBoardState.page - 1) + '" aria-label="이전 페이지"' + (noticeBoardState.page === 1 ? ' disabled' : '') + '></button>' +
      pageButtons +
      '<button class="noticeBoardPageArrow isNext" type="button" data-notice-page="' + Math.min(totalPages, noticeBoardState.page + 1) + '" aria-label="다음 페이지"' + (noticeBoardState.page === totalPages ? ' disabled' : '') + '></button>';
    syncNoticeMobileControls(hasMoreMobileItems);
  }

  function resetNoticeMobileLoad() {
    noticeBoardState.mobileVisibleCount = 0;
    noticeBoardState.isMobileLoading = false;
    if (noticeMobileLoader) noticeMobileLoader.hidden = true;
  }

  function loadMoreNoticeBoardItems() {
    if (!noticeMobileQuery.matches || noticeBoardState.isMobileLoading) return;
    var regularItems = getNoticeBoardFilteredItems().filter(function (item) { return !item.pinned; });
    if (noticeBoardState.mobileVisibleCount >= regularItems.length) return;

    noticeBoardState.isMobileLoading = true;
    if (noticePullHint) noticePullHint.hidden = true;
    if (noticeMobileLoader) noticeMobileLoader.hidden = false;

    window.setTimeout(function () {
      noticeBoardState.mobileVisibleCount = Math.min(noticeBoardState.mobileVisibleCount + noticeBoardState.pageSize, regularItems.length);
      noticeBoardState.isMobileLoading = false;
      if (noticeMobileLoader) noticeMobileLoader.hidden = true;
      renderNoticeBoard();
    }, 420);
  }

  if (noticeBoardList) {
    noticeBoardFilterButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        var type = button.getAttribute('data-notice-filter');
        var isActive = button.classList.contains('isActive');

        button.classList.toggle('isActive', !isActive);
        button.setAttribute('aria-pressed', String(!isActive));
        noticeBoardState.filters = noticeBoardFilterButtons
          .filter(function (filterButton) { return filterButton.classList.contains('isActive'); })
          .map(function (filterButton) { return filterButton.getAttribute('data-notice-filter'); });
        noticeBoardState.page = 1;
        resetNoticeMobileLoad();
        renderNoticeBoard();
      });
    });

    if (noticeBoardSearch) {
      noticeBoardSearch.addEventListener('submit', function (event) {
        event.preventDefault();
        noticeBoardState.searchType = noticeBoardSearch.elements.type.value;
        noticeBoardState.keyword = noticeBoardSearch.elements.keyword.value;
        noticeBoardState.page = 1;
        resetNoticeMobileLoad();
        renderNoticeBoard();
      });
    }

    if (noticeBoardPagination) {
      noticeBoardPagination.addEventListener('click', function (event) {
        var button = event.target.closest('[data-notice-page]');
        if (!button) return;
        noticeBoardState.page = Number(button.getAttribute('data-notice-page')) || 1;
        renderNoticeBoard();
      });
    }

    window.addEventListener('touchstart', function (event) {
      if (!noticeMobileQuery.matches) return;
      noticeBoardState.touchStartY = event.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchmove', function (event) {
      if (!noticeMobileQuery.matches || !isNearNoticePageBottom()) return;
      var touchDelta = noticeBoardState.touchStartY - event.touches[0].clientY;
      if (touchDelta > 48) loadMoreNoticeBoardItems();
    }, { passive: true });

    noticeMobileQuery.addEventListener('change', function () {
      resetNoticeMobileLoad();
      renderNoticeBoard();
    });

    renderNoticeBoard();
  }

  var secretPostModal = document.querySelector('[data-secret-post-modal]');
  var secretPostForm = secretPostModal ? secretPostModal.querySelector('[data-secret-post-form]') : null;
  var secretPostPassword = secretPostForm ? secretPostForm.elements.password : null;
  var secretPostTrigger = null;
  var secretPostDestination = '';

  function openSecretPostModal(trigger) {
    if (!secretPostModal) return;
    secretPostTrigger = trigger;
    secretPostDestination = trigger.getAttribute('href') || '';
    secretPostModal.hidden = false;
    document.body.classList.add('isSecretPostModalOpen');
    if (secretPostPassword) {
      secretPostPassword.value = '';
      window.setTimeout(function () {
        secretPostPassword.focus();
      }, 0);
    }
  }

  function closeSecretPostModal() {
    if (!secretPostModal) return;
    secretPostModal.hidden = true;
    document.body.classList.remove('isSecretPostModalOpen');
    if (secretPostTrigger) secretPostTrigger.focus();
    secretPostTrigger = null;
    secretPostDestination = '';
  }

  if (noticeBoardList && secretPostModal) {
    noticeBoardList.addEventListener('click', function (event) {
      var secretLink = event.target.closest('[data-secret-post]');
      if (!secretLink) return;
      event.preventDefault();
      openSecretPostModal(secretLink);
    });

    secretPostModal.addEventListener('click', function (event) {
      if (event.target.closest('[data-secret-post-close]')) closeSecretPostModal();
    });

    if (secretPostForm) {
      secretPostForm.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!secretPostPassword || !secretPostPassword.value) return;
        var destination = secretPostDestination;
        closeSecretPostModal();
        if (destination) window.location.href = destination;
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !secretPostModal.hidden) closeSecretPostModal();
    });
  }

  var joinTermsForm = document.querySelector('[data-join-terms-form]');
  if (joinTermsForm) {
    var joinAllCheck = joinTermsForm.querySelector('[data-join-all]');
    var joinRequiredChecks = Array.prototype.slice.call(joinTermsForm.querySelectorAll('[data-join-required]'));

    function syncJoinAllCheck() {
      if (!joinAllCheck || !joinRequiredChecks.length) return;
      joinAllCheck.checked = joinRequiredChecks.every(function (checkbox) {
        return checkbox.checked;
      });
    }

    if (joinAllCheck) {
      joinAllCheck.addEventListener('change', function () {
        joinRequiredChecks.forEach(function (checkbox) {
          checkbox.checked = joinAllCheck.checked;
        });
      });
    }

    joinRequiredChecks.forEach(function (checkbox) {
      checkbox.addEventListener('change', syncJoinAllCheck);
    });

    joinTermsForm.addEventListener('submit', function (event) {
      if (!joinRequiredChecks.every(function (checkbox) { return checkbox.checked; })) {
        event.preventDefault();
        joinRequiredChecks[0].focus();
      }
    });
  }

  var heroSlider = document.querySelector('[data-hero-slider]');
  var heroSlides = heroSlider ? Array.prototype.slice.call(heroSlider.querySelectorAll('[data-hero-slide]')) : [];
  var heroBackgrounds = heroSlider ? Array.prototype.slice.call(heroSlider.querySelectorAll('[data-hero-bg]')) : [];
  var heroPager = heroSlider ? heroSlider.querySelector('[data-hero-pager]') : null;
  var heroIndex = 0;
  var heroTimer = null;

  function activateHeroSlide(index) {
    if (!heroSlides.length || !heroPager) return;
    heroIndex = (index + heroSlides.length) % heroSlides.length;
    heroSlider.setAttribute('data-hero-active', String(heroIndex));

    heroSlides.forEach(function (slide, slideIndex) {
      slide.classList.toggle('isActive', slideIndex === heroIndex);
      slide.setAttribute('aria-hidden', String(slideIndex !== heroIndex));
    });

    heroBackgrounds.forEach(function (background, backgroundIndex) {
      background.classList.toggle('isActive', backgroundIndex === heroIndex);
    });

    heroPager.querySelectorAll('button').forEach(function (button, buttonIndex) {
      button.classList.toggle('isActive', buttonIndex === heroIndex);
      button.setAttribute('aria-current', buttonIndex === heroIndex ? 'true' : 'false');
    });
  }

  function startHeroLoop() {
    if (heroTimer) window.clearInterval(heroTimer);
    heroTimer = window.setInterval(function () {
      activateHeroSlide(heroIndex + 1);
    }, 4000);
  }

  if (heroSlides.length && heroPager) {
    heroPager.innerHTML = heroSlides.map(function (_, index) {
      return '<button type="button" aria-label="메인 비주얼 ' + (index + 1) + '번 보기"></button>';
    }).join('');

    heroPager.querySelectorAll('button').forEach(function (button, index) {
      button.addEventListener('click', function () {
        activateHeroSlide(index);
        startHeroLoop();
      });
    });

    activateHeroSlide(0);
    startHeroLoop();
  }
}());
