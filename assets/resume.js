const STORAGE_THEME = 'resume-theme';
const STORAGE_LANG = 'resume-lang';

// Citation counts from Google Scholar profile (user=aMh2wRgAAAAJ).
const publicationCitations = {
  music4all: 121,
  'systematic-review': 15,
  'metadata-rnn': 8,
  'geo-referenced': 1,
  'dual-rnn': 0,
};

const content = {
  en: {
    title: 'Igor Santana — Resume',
    role: 'MSc in Computer Science · Senior Software Engineer',
    location: 'Maringá, Brazil',
    labels: {
      citation: 'citation',
      citations: 'citations',
    },
    sections: {
      summary: 'Summary',
      experience: 'Professional Experience',
      academic: 'Academic Experience',
      skills: 'Skills',
      publications: 'Publications',
    },
    summary: [
      'Senior software engineer with 10+ years of frontend experience across Angular, React, and Vue.js, in varied settings: mobile applications in agribusiness, financial products, and international enterprise platforms in logistics.',
      'I have led design system and micro frontend initiatives, focusing on scalable UI architecture and shared standards that help teams ship reliably at scale.',
      'I hold an MSc in computer science with published research on recommender systems, <em>deep learning</em>, contextual embeddings, and neural network models for personalized recommendation. This work is closely related to the foundations behind today\'s AI and LLM-driven products.',
    ],
    experience: [
      {
        company: 'Zup Innovation',
        role: 'Senior Software Engineer',
        period: 'Feb 2025 — Present',
        location: 'Remote',
        description:
          'Allocated to Itaú Unibanco\'s real estate collateral squad, I develop micro frontends with Angular in cross-functional teams. On my previous squad, I worked in the agricultural sector, also building micro frontends.',
      },
      {
        company: 'GLS Portugal',
        role: 'Senior Software Engineer',
        period: 'Mar 2022 — Nov 2024',
        location: 'Lisbon, Portugal (Remote)',
        description:
          'I helped define and build a design system to accelerate delivery across European branches, contributed to the CORE Platform for micro frontends, and worked with international teams to adopt shared components and standards.',
      },
      {
        company: 'Objective',
        role: 'Mid-level Software Engineer',
        period: 'Nov 2021 — Feb 2022',
        location: 'Remote',
        description:
          'I developed frontend applications with React and Liferay for an international project in the health insurance area. I built user-facing features for portal and web experiences, working with distributed teams across countries.',
      },
      {
        company: 'Accountfy',
        role: 'Mid-level Software Engineer',
        period: 'Jun 2021 — Nov 2021',
        location: 'Remote',
        description:
          'I owned the frontend of the Cash Management module, building financial systems with Angular in a fintech product. I delivered features for cash flow management and banking operations, collaborating with product, design, and backend teams.',
      },
      {
        company: 'FarmGO Agrosolutions',
        role: 'Mid-level Software Engineer',
        period: 'Jun 2020 — Jun 2021',
        location: 'Maringá, Brazil',
        description:
          'I developed mobile applications with Ionic and Vue.js for field use in agribusiness, and refactored legacy frontend and backend systems built with Django and jQuery.',
      },
      {
        company: 'Gumga Tecnologia',
        role: 'Entry-level Software Engineer',
        period: 'Nov 2014 — Mar 2016',
        location: 'Maringá, Brazil',
        description:
          'I worked on a web framework with Angular 1.x and Bootstrap adopted by partner companies, delivering reusable UI components and shared patterns. I also contributed to a code generator that accelerated new project setup and reduced boilerplate across client engagements.',
      },
    ],
    education: [
      {
        school: 'Universidade Estadual de Maringá',
        degree: 'MSc in Computer Science',
        period: '2018 — 2020',
        detail:
          'Master\'s thesis exploring recurrent neural networks to generate contextual embeddings from users\' listening sequences. The embeddings were applied to four context-aware music recommender systems and evaluated on two datasets, outperforming the baseline model across all metrics used.',
        download: {
          href: 'files/Igor-Santana-Masters-Thesis-RNN-Music-Recommendation.pdf',
          label: 'Download master\'s dissertation',
        },
      },
      {
        school: 'Universidade Estadual de Maringá',
        degree: 'BSc in Informatics',
        period: '2013 — 2017',
        detail:
          'Undergraduate thesis proposing data mining and clustering techniques to automatically extract contextual information from georeferenced data. The work compared clustering algorithms and evaluated their impact on context-aware recommender systems using Foursquare and Yelp datasets.',
        download: {
          href: 'files/Igor-Santana-Bachelor-Thesis-Context-Mining.pdf',
          label: 'Download undergraduate thesis',
        },
        academicRole: {
          role: 'Undergraduate Researcher',
          org: 'CNPq',
          period: 'Aug 2016 — Jul 2017',
          location: 'Maringá, Brazil',
          detail:
            'Expanded abstract on combining the Combined Reduction and DaVI context-aware recommendation algorithms to improve prediction quality over each method alone. Implemented in Java using the CARSKit framework.',
          download: {
            href: 'files/Igor-Santana-Undergraduate-Research-Context-Recommendation.pdf',
            label: 'Download expanded abstract',
          },
        },
      },
    ],
    skills: [
      {
        label: 'Frontend',
        items: ['TypeScript', 'JavaScript', 'Angular', 'React', 'Vue.js', 'Ionic'],
      },
      {
        label: 'Architecture',
        items: ['Micro frontends', 'Design systems', 'REST APIs'],
      },
      {
        label: 'Tooling',
        items: ['Node.js', 'Docker', 'AWS', 'GitHub Actions', 'CI/CD'],
      },
      {
        label: 'Background',
        items: ['Python', 'Java', 'Machine learning'],
      },
      {
        label: 'Languages',
        items: ['Portuguese (native)', 'English (professional)'],
      },
    ],
    publications: [
      {
        id: 'music4all',
        title: 'Music4All: A New Music Database and Its Applications',
        venue: '27th International Conference on Systems, Signals and Image Processing (IWSSIP), 2020',
        detail:
          'Introduces Music4All, a music database with metadata and contextual listening data, and demonstrates its applications in music recommendation research.',
        download: {
          href: 'files/Igor-Santana-Publication-Music4All-Database.pdf',
          label: 'Download paper',
        },
      },
      {
        id: 'systematic-review',
        title: 'A Systematic Review on Context-Aware Recommender Systems Using Deep Learning and Embeddings',
        venue: 'arXiv:2007.04782, 2020',
        detail:
          'Systematic review of context-aware recommender systems that use deep learning and embeddings, mapping methods, datasets, and open challenges in the field.',
        download: {
          href: 'files/Igor-Santana-Publication-Systematic-Review-Context-Aware-Deep-Learning.pdf',
          label: 'Download paper',
        },
      },
      {
        id: 'metadata-rnn',
        title: 'Context-Aware Music Recommendation with Metadata Awareness and Recurrent Neural Networks',
        venue: 'Computing and Informatics 41 (3), 834–860, 2022',
        detail:
          'Proposes Metadata-Aware and recurrent neural network methods to extract contextual embeddings from listening sequences, evaluated across four context-aware music recommenders.',
        download: {
          href: 'files/Igor-Santana-Publication-Context-Aware-Music-Metadata-RNN.pdf',
          label: 'Download paper',
        },
      },
      {
        id: 'geo-referenced',
        title: 'Transforming Geo-Referenced Data in Contextual Information for Context-Aware Recommender Systems',
        venue: 'IEEE/WIC/ACM International Conference on Web Intelligence (WI), 2018',
        detail:
          'Applies clustering to transform georeferenced data into contextual regions for context-aware recommender systems, evaluated on Foursquare and Yelp datasets.',
        download: {
          href: 'files/Igor-Santana-Publication-Geo-Referenced-Context-Information.pdf',
          label: 'Download paper',
        },
      },
      {
        id: 'dual-rnn',
        title: 'Improving Context-Aware Music Recommender Systems with a Dual Recurrent Neural Network',
        venue: 'Information Management and Big Data — SIMBig 2020, 2021',
        detail:
          'Uses a dual recurrent neural network to generate contextual embeddings from listening sequences, improving four context-aware music recommenders on two datasets.',
        download: {
          href: 'files/Igor-Santana-Publication-Dual-RNN-Context-Aware-Music.pdf',
          label: 'Download paper',
        },
      },
    ],
    links: {
      email: 'Email',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      lattes: 'Lattes',
    },
    toggles: {
      themeToLight: 'Switch to day mode',
      themeToDark: 'Switch to night mode',
      langEn: 'English',
      langPt: 'Portuguese',
      selectLanguage: 'Select language',
    },
  },
  pt: {
    title: 'Igor Santana — Currículo',
    role: 'Mestre em Ciências da Computação · Engenheiro de Software Sênior',
    location: 'Maringá, Paraná, Brasil',
    labels: {
      citation: 'citação',
      citations: 'citações',
    },
    sections: {
      summary: 'Resumo',
      experience: 'Experiência Profissional',
      academic: 'Experiência Acadêmica',
      skills: 'Competências',
      publications: 'Publicações',
    },
    summary: [
      'Engenheiro de software sênior com mais de dez anos de experiência em frontend, com atuação em Angular, React e Vue.js em contextos variados: aplicações mobile no agronegócio, produtos financeiros e plataformas enterprise internacionais em logística.',
      'Liderei iniciativas de design system e micro frontends, com foco em arquitetura de interface escalável e padrões compartilhados que permitem entregar com consistência em produtos de alta complexidade.',
      'Possuo mestrado em Ciência da Computação e publicações em sistemas de recomendação, <em>deep learning</em>, embeddings contextuais e modelos de redes neurais para recomendação personalizada. Esse trabalho se relaciona diretamente com as fundações dos produtos atuais baseados em IA e LLMs.',
    ],
    experience: [
      {
        company: 'Zup Innovation',
        role: 'Desenvolvedor de front-end sênior',
        period: 'fev. 2025 — Presente',
        location: 'Remoto',
        description:
          'Alocado ao squad de garantias de imóveis do Itaú Unibanco, atuo no desenvolvimento de micro frontends com Angular em equipes multidisciplinares. No squad anterior, atuei no setor agrícola, também com micro frontends.',
      },
      {
        company: 'GLS Portugal',
        role: 'Engenheiro de Software Sênior',
        period: 'fev. 2022 — dez. 2024',
        location: 'Lisboa, Portugal (Remoto)',
        description:
          'Participei da definição e do desenvolvimento de um design system para acelerar a entrega de aplicações em filiais na Europa. Também trabalhei na CORE Platform, conjunto de ferramentas para criação de micro frontends, e colaborei com equipes internacionais na adoção de componentes e padrões compartilhados.',
      },
      {
        company: 'Objective',
        role: 'Desenvolvedor de Software Pleno',
        period: 'nov. 2021 — fev. 2022',
        location: 'Remoto',
        description:
          'Desenvolvi aplicações frontend com React e Liferay em um projeto internacional na área de planos de saúde. Construí funcionalidades para portais e experiências web, em colaboração com equipes distribuídas em diferentes países.',
      },
      {
        company: 'Accountfy',
        role: 'Desenvolvedor de Software Pleno',
        period: 'jun. 2021 — nov. 2021',
        location: 'Remoto',
        description:
          'Fui responsável pelo frontend do módulo de Cash Management, desenvolvendo sistemas financeiros com Angular em um produto fintech. Entreguei funcionalidades de gestão de fluxo de caixa e operações bancárias, em colaboração com equipes de produto, design e backend.',
      },
      {
        company: 'FarmGO Agrosolutions',
        role: 'Desenvolvedor de Software Pleno',
        period: 'jun. 2020 — jun. 2021',
        location: 'Maringá, Paraná',
        description:
          'Desenvolvi aplicações mobile com Ionic e Vue.js para uso em campo no agronegócio. Também atuei na refatoração e evolução de sistemas de frontend e backend legados em Django e jQuery.',
      },
      {
        company: 'Gumga Tecnologia',
        role: 'Desenvolvedor de Software Júnior',
        period: 'nov. 2014 — mar. 2016',
        location: 'Maringá e Região',
        description:
          'Trabalhei no desenvolvimento de um framework web com Angular 1.x e Bootstrap, adotado por empresas parceiras, entregando componentes reutilizáveis e padrões compartilhados. Também contribuí para um gerador de código que acelerava o início de novos projetos e reduzia o boilerplate em entregas para clientes.',
      },
    ],
    education: [
      {
        school: 'Universidade Estadual de Maringá',
        degree: 'Mestrado em Ciência da Computação',
        period: '2018 — 2020',
        detail:
          'Dissertação que explorou redes neurais recorrentes para obter embeddings contextuais a partir da sequência de músicas ouvidas pelos usuários. Os vetores gerados foram aplicados a quatro sistemas de recomendação musical sensíveis ao contexto e avaliados em duas bases de dados, superando o modelo de baseline em todas as métricas utilizadas.',
        download: {
          href: 'files/Igor-Santana-Masters-Thesis-RNN-Music-Recommendation.pdf',
          label: 'Baixar dissertação de mestrado',
        },
      },
      {
        school: 'Universidade Estadual de Maringá',
        degree: 'Bacharelado em Informática',
        period: '2013 — 2017',
        detail:
          'Monografia que propôs o uso de mineração de dados e técnicas de agrupamento para extrair automaticamente informação contextual a partir de dados georreferenciados. O trabalho comparou algoritmos de clustering e avaliou o impacto dessas informações em sistemas de recomendação sensíveis ao contexto, com bases como Foursquare e Yelp.',
        download: {
          href: 'files/Igor-Santana-Bachelor-Thesis-Context-Mining.pdf',
          label: 'Baixar monografia',
        },
        academicRole: {
          role: 'Pesquisador de Iniciação Científica',
          org: 'CNPq',
          period: 'ago. 2016 — jul. 2017',
          location: 'Maringá, Paraná',
          detail:
            'Resumo expandido de projeto que uniu os algoritmos Combined Reduction e DaVI de recomendação sensível ao contexto para melhorar os resultados de predição. O trabalho foi desenvolvido em Java com o framework CARSKit.',
          download: {
            href: 'files/Igor-Santana-Undergraduate-Research-Context-Recommendation.pdf',
            label: 'Baixar resumo expandido',
          },
        },
      },
    ],
    skills: [
      {
        label: 'Frontend',
        items: ['TypeScript', 'JavaScript', 'Angular', 'React', 'Vue.js', 'Ionic'],
      },
      {
        label: 'Arquitetura',
        items: ['Micro frontends', 'Design systems', 'APIs REST'],
      },
      {
        label: 'Ferramentas',
        items: ['Node.js', 'Docker', 'AWS', 'GitHub Actions', 'CI/CD'],
      },
      {
        label: 'Formação',
        items: ['Python', 'Java', 'Aprendizado de máquina'],
      },
      {
        label: 'Idiomas',
        items: ['Português (nativo)', 'Inglês (profissional completo)'],
      },
    ],
    publications: [
      {
        id: 'music4all',
        title: 'Music4All: A New Music Database and Its Applications',
        venue: '27th International Conference on Systems, Signals and Image Processing (IWSSIP), 2020',
        detail:
          'Apresenta o Music4All, uma base de dados musical com metadados e dados de escuta contextual, e demonstra suas aplicações em pesquisa em recomendação musical.',
        download: {
          href: 'files/Igor-Santana-Publication-Music4All-Database.pdf',
          label: 'Baixar artigo',
        },
      },
      {
        id: 'systematic-review',
        title: 'A Systematic Review on Context-Aware Recommender Systems Using Deep Learning and Embeddings',
        venue: 'arXiv:2007.04782, 2020',
        detail:
          'Revisão sistemática de sistemas de recomendação sensíveis ao contexto que utilizam deep learning e embeddings, mapeando métodos, bases de dados e desafios abertos na área.',
        download: {
          href: 'files/Igor-Santana-Publication-Systematic-Review-Context-Aware-Deep-Learning.pdf',
          label: 'Baixar artigo',
        },
      },
      {
        id: 'metadata-rnn',
        title: 'Context-Aware Music Recommendation with Metadata Awareness and Recurrent Neural Networks',
        venue: 'Computing and Informatics 41 (3), 834–860, 2022',
        detail:
          'Propõe métodos Metadata-Aware e redes neurais recorrentes para extrair embeddings contextuais a partir de sequências de escuta, avaliados em quatro sistemas de recomendação musical sensíveis ao contexto.',
        download: {
          href: 'files/Igor-Santana-Publication-Context-Aware-Music-Metadata-RNN.pdf',
          label: 'Baixar artigo',
        },
      },
      {
        id: 'geo-referenced',
        title: 'Transforming Geo-Referenced Data in Contextual Information for Context-Aware Recommender Systems',
        venue: 'IEEE/WIC/ACM International Conference on Web Intelligence (WI), 2018',
        detail:
          'Aplica clustering para transformar dados georreferenciados em regiões contextuais para sistemas de recomendação sensíveis ao contexto, avaliado em bases Foursquare e Yelp.',
        download: {
          href: 'files/Igor-Santana-Publication-Geo-Referenced-Context-Information.pdf',
          label: 'Baixar artigo',
        },
      },
      {
        id: 'dual-rnn',
        title: 'Improving Context-Aware Music Recommender Systems with a Dual Recurrent Neural Network',
        venue: 'Information Management and Big Data — SIMBig 2020, 2021',
        detail:
          'Utiliza uma rede neural recorrente dupla para gerar embeddings contextuais a partir de sequências de música, melhorando quatro sistemas de recomendação musical sensíveis ao contexto em duas bases de dados.',
        download: {
          href: 'files/Igor-Santana-Publication-Dual-RNN-Context-Aware-Music.pdf',
          label: 'Baixar artigo',
        },
      },
    ],
    links: {
      email: 'E-mail',
      linkedin: 'LinkedIn',
      github: 'GitHub',
      lattes: 'Lattes',
    },
    toggles: {
      themeToLight: 'Mudar para modo dia',
      themeToDark: 'Mudar para modo noite',
      langEn: 'Inglês',
      langPt: 'Português',
      selectLanguage: 'Selecionar idioma',
    },
  },
};

function getPreferredTheme() {
  const stored = localStorage.getItem(STORAGE_THEME);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

function getPreferredLang() {
  const stored = localStorage.getItem(STORAGE_LANG);
  if (stored === 'en' || stored === 'pt') return stored;
  return 'en';
}

function updateThemeToggle() {
  const theme = document.documentElement.getAttribute('data-theme') || 'dark';
  const lang = document.documentElement.getAttribute('lang')?.startsWith('pt') ? 'pt' : 'en';
  const data = content[lang];
  const themeToggle = document.getElementById('theme-toggle');
  const icon = document.getElementById('theme-toggle-icon');
  if (!themeToggle || !icon) return;

  const isDark = theme === 'dark';
  themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  themeToggle.setAttribute(
    'aria-label',
    isDark ? data.toggles.themeToLight : data.toggles.themeToDark
  );
  icon.className = isDark ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

function formatCitationCount(count, labels) {
  const word = count === 1 ? labels.citation : labels.citations;
  return `${count} ${word}`;
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(STORAGE_THEME, theme);
  updateThemeToggle();
}

function setLang(lang) {
  document.documentElement.setAttribute('lang', lang === 'pt' ? 'pt-BR' : 'en');
  localStorage.setItem(STORAGE_LANG, lang);
  renderContent(lang);
}

function updateLangDropdown(lang) {
  const data = content[lang];
  const flags = {
    en: 'assets/flags/gb.svg',
    pt: 'assets/flags/br.svg',
  };
  const currentFlag = document.getElementById('lang-current-flag');
  const currentLabel = document.getElementById('lang-current-label');
  const langToggle = document.getElementById('lang-toggle');
  const labelKey = lang === 'en' ? 'langEn' : 'langPt';

  if (currentFlag) currentFlag.src = flags[lang];
  if (currentLabel) currentLabel.textContent = data.toggles[labelKey];
  if (langToggle) langToggle.setAttribute('aria-label', data.toggles.selectLanguage);

  document.querySelectorAll('[data-lang-option]').forEach((btn) => {
    const isSelected = btn.dataset.langOption === lang;
    btn.setAttribute('aria-selected', isSelected ? 'true' : 'false');
  });
}

function closeLangDropdown() {
  const dropdown = document.getElementById('lang-dropdown');
  const toggle = document.getElementById('lang-toggle');
  const menu = document.getElementById('lang-menu');
  if (!dropdown || !toggle || !menu) return;

  dropdown.classList.remove('lang-dropdown--open');
  toggle.setAttribute('aria-expanded', 'false');
  menu.hidden = true;
}

function openLangDropdown() {
  const dropdown = document.getElementById('lang-dropdown');
  const toggle = document.getElementById('lang-toggle');
  const menu = document.getElementById('lang-menu');
  if (!dropdown || !toggle || !menu) return;

  dropdown.classList.add('lang-dropdown--open');
  toggle.setAttribute('aria-expanded', 'true');
  menu.hidden = false;
}

function initLangDropdown() {
  const dropdown = document.getElementById('lang-dropdown');
  const toggle = document.getElementById('lang-toggle');
  const menu = document.getElementById('lang-menu');
  if (!dropdown || !toggle || !menu) return;

  toggle.addEventListener('click', () => {
    if (dropdown.classList.contains('lang-dropdown--open')) {
      closeLangDropdown();
    } else {
      openLangDropdown();
    }
  });

  document.querySelectorAll('[data-lang-option]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setLang(btn.dataset.langOption);
      closeLangDropdown();
    });
  });

  document.addEventListener('click', (event) => {
    if (!dropdown.contains(event.target)) closeLangDropdown();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLangDropdown();
  });
}

function renderContent(lang) {
  const data = content[lang];
  document.title = data.title;

  const setText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };

  setText('role', data.role);
  setText('location', data.location);
  const summaryEl = document.getElementById('summary-text');
  summaryEl.innerHTML = data.summary
    .map((paragraph) => `<p>${paragraph}</p>`)
    .join('');

  Object.entries(data.sections).forEach(([key, label]) => {
    setText(`section-${key}`, label);
  });

  Object.entries(data.links).forEach(([key, label]) => {
    const el = document.querySelector(`[data-link-label="${key}"]`);
    if (el) el.setAttribute('aria-label', label);
  });

  document.querySelectorAll('[data-toggle-label]').forEach((el) => {
    const key = el.dataset.toggleLabel;
    if (data.toggles[key]) el.textContent = data.toggles[key];
  });

  updateLangDropdown(lang);
  updateThemeToggle();

  const experienceList = document.getElementById('experience-list');
  experienceList.innerHTML = data.experience
    .map(
      (job) => `
      <article class="entry">
        <header class="entry-header">
          <div>
            <h3 class="entry-title">${job.role} · ${job.location}</h3>
            <p class="entry-org">${job.company}</p>
          </div>
          <div class="entry-meta">
            <span>${job.period}</span>
          </div>
        </header>
        <p class="entry-description">${job.description}</p>
      </article>`
    )
    .join('');

  const renderDownloadButton = (download) => {
    if (!download) return '';
    return `
      <a href="${download.href}" class="download-btn" download aria-label="${download.label}">
        <i class="fa-solid fa-download" aria-hidden="true"></i>
      </a>`;
  };

  const educationList = document.getElementById('education-list');
  educationList.innerHTML = data.education
    .map((edu) => {
      const degreeEntry = `
      <article class="entry">
        <header class="entry-header">
          <div>
            <h3 class="entry-title">${edu.degree}</h3>
            <p class="entry-org">${edu.school}</p>
          </div>
          <div class="entry-meta">
            <span>${edu.period}</span>
            ${renderDownloadButton(edu.download)}
          </div>
        </header>
        <p class="entry-detail">${edu.detail}</p>
      </article>`;

      const academicRoleEntry = edu.academicRole
        ? `
      <article class="entry">
        <header class="entry-header">
          <div>
            <h3 class="entry-title">${edu.academicRole.role} · ${edu.academicRole.location}</h3>
            <p class="entry-org">${edu.academicRole.org}</p>
          </div>
          <div class="entry-meta">
            <span>${edu.academicRole.period}</span>
            ${renderDownloadButton(edu.academicRole.download)}
          </div>
        </header>
        <p class="entry-detail">${edu.academicRole.detail}</p>
      </article>`
        : '';

      return degreeEntry + academicRoleEntry;
    })
    .join('');

  const skillsBlock = document.getElementById('skills-block');
  skillsBlock.innerHTML = data.skills
    .map(
      (group) => `
      <div class="skills-group">
        <h3 class="skills-group__label">${group.label}</h3>
        <ul class="skill-tags">
          ${group.items.map((item) => `<li class="skill-tag">${item}</li>`).join('')}
        </ul>
      </div>`
    )
    .join('');

  const publicationsList = document.getElementById('publications-list');
  publicationsList.innerHTML = data.publications
    .map((pub) => {
      const citations = publicationCitations[pub.id];
      const citationText =
        citations != null && citations > 0
          ? ` · ${formatCitationCount(citations, data.labels)}`
          : '';

      return `
      <li class="pub-entry">
        <header class="pub-entry__header">
          <div>
            <p class="pub-title">${pub.title}</p>
            <p class="pub-venue">${pub.venue}${citationText}</p>
          </div>
          <div class="entry-meta">
            ${renderDownloadButton(pub.download)}
          </div>
        </header>
        <p class="entry-detail">${pub.detail}</p>
      </li>`;
    })
    .join('');
}

function initResume() {
  const theme = getPreferredTheme();
  const lang = getPreferredLang();

  setTheme(theme);
  setLang(lang);

  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  initLangDropdown();
}

document.addEventListener('DOMContentLoaded', initResume);
