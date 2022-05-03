const LANG = 'en';

const API = {
  search: (lang = 'en', query = '') => `https://bid.cars/app/search/${lang}/vin-lot/${query}/true`,
  searchResult: (query = '') =>
    `https://bid.cars/en/search/results?search-type=typing&query=${query}&auction-type=All&year-from=1900&year-to=2023`,
  root: 'https://bid.cars/en/search/results?search-type=filters',
  automobile: 'https://bid.cars/app/search/toolbar-type/automobile',
  motorcycle: 'https://bid.cars/app/search/toolbar-type/motorcycle',
  atv: 'https://bid.cars/app/search/toolbar-type/atv',
  'personal-watercraft': 'https://bid.cars/app/search/toolbar-type/personal-watercraft',
  snowmobile: 'https://bid.cars/app/search/toolbar-type/snowmobile',
  boat: 'https://bid.cars/app/search/toolbar-type/boat',
  trailer: 'https://bid.cars/app/search/toolbar-type/trailer',
  'travel-trailer': 'https://bid.cars/app/search/toolbar-type/travel-trailer',
  'motor-home': 'https://bid.cars/app/search/toolbar-type/motor-home',
  'emergency-equipment': 'https://bid.cars/app/search/toolbar-type/emergency-equipment',
  'heavy-equipment': 'https://bid.cars/app/search/toolbar-type/heavy-equipment',
  'farm-equipment': 'https://bid.cars/app/search/toolbar-type/farm-equipment',
  'forestry-equipment': 'https://bid.cars/app/search/toolbar-type/forestry-equipment',
  bus: 'https://bid.cars/app/search/toolbar-type/bus',
  truck: 'https://bid.cars/app/search/toolbar-type/truck',
};

const API_ARCHIVED = {
  search: (lang = 'en', query = '') => `https://bid.cars/app/search/${lang}/vin-lot/${query}/true`,
  searchResult: (query = '') =>
    `https://bid.cars/en/search/results?search-type=typing&query=${query}&auction-type=All&year-from=1900&year-to=2023`,
  root: 'https://bid.cars/en/search/archived/results?search-type=filters',
  automobile: 'https://bid.cars/app/search/archived/toolbar-type/automobile',
  motorcycle: 'https://bid.cars/app/search/archived/toolbar-type/motorcycle',
  atv: 'https://bid.cars/app/search/archived/toolbar-type/atv',
  'personal-watercraft': 'https://bid.cars/app/search/archived/toolbar-type/personal-watercraft',
  snowmobile: 'https://bid.cars/app/search/archived/toolbar-type/snowmobile',
  boat: 'https://bid.cars/app/search/archived/toolbar-type/boat',
  trailer: 'https://bid.cars/app/search/archived/toolbar-type/trailer',
  'travel-trailer': 'https://bid.cars/app/search/archived/toolbar-type/travel-trailer',
  'motor-home': 'https://bid.cars/app/search/archived/toolbar-type/motor-home',
  'emergency-equipment': 'https://bid.cars/app/search/archived/toolbar-type/emergency-equipment',
  'heavy-equipment': 'https://bid.cars/app/search/archived/toolbar-type/heavy-equipment',
  'farm-equipment': 'https://bid.cars/app/search/archived/toolbar-type/farm-equipment',
  'forestry-equipment': 'https://bid.cars/app/search/archived/toolbar-type/forestry-equipment',
  bus: 'https://bid.cars/app/search/archived/toolbar-type/bus',
  truck: 'https://bid.cars/app/search/archived/toolbar-type/truck',
};

const getSearchResult = debounce((query, lang) => {
  const api = activeFilters.archived ? API_ARCHIVED : API;
  $.get(api.search(lang, query), (data) => {
    const { results, url = '' } = JSON.parse(data);
    $('#show-btn').text(`Show ${results} vehicles`);
    activeFilters.searchResult = url;
    $('#show-btn').prop('disabled', false);
  });
}, 500);

let notArchivedData = {};
let data = {};
let activeFilters = {
  type: 'automobile',
  make: '',
  model: '',
  generation: '',
  from: '',
  to: '',
  iaai: true,
  copart: true,
  search: '',
  archived: false,
  searchResult: '',
};

function withEmptyOption(options, text = '', all = '') {
  options = options.filter((o) => o.text !== all);

  return [...(all ? [{ id: '', text: all }] : []), ...options];
}

function generateYearsOptions(from = 1900) {
  const to = new Date().getFullYear();
  const data = [];

  for (let i = to; i > from; i--) {
    data.push({ id: i.toString(), text: i.toString() });
  }

  return data;
}

$(document).ready(function () {
  $('#make').select2();
  $('#model').select2();
  $('#generation').select2();
  $('#from').select2({ minimumResultsForSearch: -1, data: withEmptyOption(generateYearsOptions(), '', 'From') });
  $('#to').select2({ minimumResultsForSearch: -1, data: withEmptyOption(generateYearsOptions(), '', 'To') });
  $.get(API.automobile, onLoad);
});

function onLoad(response) {
  const res = response.push ? response : JSON.parse(response);
  const items = {};

  res.forEach((item) => {
    if (!items[item.make]) {
      items[item.make] = [];
    }
    items[item.make].push(item);
  });

  data = items;

  const values = Object.keys(items).map((name) => ({ id: name, text: name }));
  initMake(values);
}

function initMake(values) {
  $('#make').empty();
  $('#make').select2({ data: withEmptyOption(values, 'Make', 'All makes') });

  $('#make').trigger('change');
  $('#make').trigger('select2:select');
  $('#model').trigger('select2:select');
  $('#model').trigger('change');
  $('#generation').trigger('select2:select');
  $('#generation').trigger('change');
}

$('input[name=vehicle-type]').change(({ target: { value } }) => {
  resetFormValues();
  activeFilters.type = value;
  $.get(API[value], onLoad);
});

$('#make').on('select2:select', ({ target: { value } }) => {
  activeFilters.make = value;

  const modelsData = value ? data[value].map(({ model }) => ({ id: model, text: model })) : [];

  $('#generation').empty();
  $('#generation').select2({ minimumResultsForSearch: -1, data: withEmptyOption([], 'Generation', 'All generations') });
  activeFilters.generation = '';

  $('#from').val('').trigger('change');
  activeFilters.from = '';
  $('#to').val('').trigger('change');
  activeFilters.to = '';

  $('#model').empty();
  $('#model').select2({ data: withEmptyOption(modelsData, 'Model', 'All models') });
  activeFilters.model = '';

  showResults(activeFilters);
});

$('#model').on('select2:select', ({ target: { value } }) => {
  activeFilters.model = value;

  const { generations = [] } = data[activeFilters.make]?.find(({ model }) => model === value) || {};
  const generationsData = generations.map(({ name, max_year, min_year }) => ({
    id: name,
    text: name,
    maxYear: max_year,
    minYear: min_year,
  }));

  $('#from').val('').trigger('change');
  activeFilters.from = '';
  $('#to').val('').trigger('change');
  activeFilters.to = '';

  $('#generation').empty();
  activeFilters.generation = '';
  $('#generation').select2({
    minimumResultsForSearch: -1,
    escapeMarkup: function (markup) {
      return markup;
    },
    templateResult: ({ text, maxYear, minYear }) =>
      `${text} ${minYear && maxYear ? `<span>(${minYear} - ${maxYear})</span>` : ''}`,
    data: withEmptyOption(generationsData, 'Generation', 'All generations'),
  });
  showResults(activeFilters);
});

$('#generation').on('select2:select', ({ target: { value } }) => {
  activeFilters.generation = value;

  const [{ minYear, maxYear } = {}] = $('#generation').select2('data') || [{}];

  activeFilters.from = minYear || '';
  $('#from').val(minYear || '');
  $('#from').trigger('change');

  activeFilters.to = maxYear || '';
  $('#to').val(maxYear || '');
  $('#to').trigger('change');
  showResults(activeFilters);
});

$('#from').on('select2:select', ({ target: { value } }) => {
  activeFilters.from = value;
  showResults(activeFilters);
});

$('#to').on('select2:select', ({ target: { value } }) => {
  activeFilters.to = value;
  showResults(activeFilters);
});

$('#iaai').on('input', ({ target }) => {
  const { checked } = target;

  if (!checked && !activeFilters.copart) {
    target.checked = true;
  } else {
    activeFilters.iaai = checked;
    showResults(activeFilters);
  }
});

$('#copart').on('input', ({ target }) => {
  const { checked } = target;

  if (!checked && !activeFilters.iaai) {
    target.checked = true;
  } else {
    activeFilters.copart = checked;
    showResults(activeFilters);
  }
});

$(document).on('select2:open', (e) => {
  if (e.target.name === 'make' || e.target.name === 'model')
    setTimeout(() => document.querySelector('.select2-search__field').focus(), 200);
});

$('#archived').on('input', ({ target: { checked } }) => {
  activeFilters.archived = checked;
  if (!checked) {
    const resCount = getSearchResultCount(activeFilters);
    if (!resCount) {
      resetFormValues();
    }
  }
  showResults(activeFilters);
});

$('#search').on('input', ({ target: { value } }) => {
  activeFilters.search = value;
  showResults(activeFilters);

  const isFormDisabled = !!value;

  if (isValidSearchQuery(value)) {
    getSearchResult(value, LANG);
  }

  $('#make').prop('disabled', isFormDisabled);
  $('#model').prop('disabled', isFormDisabled);
  $('#generation').prop('disabled', isFormDisabled);
  $('#from').prop('disabled', isFormDisabled);
  $('#to').prop('disabled', isFormDisabled);
  $('#show-btn').prop('disabled', isFormDisabled);
});

function resetFormValues() {
  $('#make').val('');
  $('#make').trigger('change');
  activeFilters.make = '';

  $('#model').val('');
  $('#model').trigger('change');
  activeFilters.model = '';

  $('#generation').val('');
  $('#generation').trigger('change');
  activeFilters.generation = '';

  $('#from').val('');
  $('#from').trigger('change');
  activeFilters.from = '';

  $('#to').val('');
  $('#to').trigger('change');
  activeFilters.to = '';

  $('#copart').prop('checked', true);
  activeFilters.copart = true;
  $('#iaai').prop('checked', true);
  activeFilters.iaai = true;

  $('#search').val('');

  activeFilters.search = '';
}

function getResultsByMakeModel({ make, model, from, to, copart, iaai }) {
  const yearFrom = from || Number.MIN_SAFE_INTEGER;
  const yearTo = to || Number.MAX_SAFE_INTEGER;

  const yearCount = data[make].find((item) => item.model === model)?.year_count || [];
  let iaaiRes = 0;
  let copartRes = 0;

  yearCount.forEach((yc) => {
    if (yc.year <= yearTo && yc.year >= yearFrom) {
      iaaiRes += yc.lot_type_0 || 0;
      copartRes += yc.lot_type_1 || 0;
    }
  });

  return iaai && copart ? iaaiRes + copartRes : iaai ? iaaiRes : copartRes;
}

function getResultsByMake({ make, from, to, copart, iaai }) {
  return data[make].reduce((acc, { model }) => {
    const res = getResultsByMakeModel({ make, model, from, to, copart, iaai });

    return acc + res || 0;
  }, 0);
}

function getSearchResultCount({ make, model, from, to, copart, iaai }) {
  let res = '';

  if (make && model) {
    res = getResultsByMakeModel({ make, model, from, to, copart, iaai });
  }

  if (make && !model) {
    res = getResultsByMake({ make, from, to, copart, iaai });
  }

  if (!make && !model) {
    res = 0;
    for (let itemMake in data) {
      res += getResultsByMake({ make: itemMake, from, to, copart, iaai }) || 0;
    }
  }

  return res;
}

function showResults(filters) {
  if (filters.archived || filters.search) {
    $('#show-btn').text('Show vehicles');
    return;
  }

  let res = getSearchResultCount(filters);

  if ((filters.make && filters.model) || (filters.make && res < 100)) {
    $('#show-btn').text(`Show ${res} vehicles`);
  } else {
    $('#show-btn').text(`Show vehicles`);
  }
}

$('#show-btn').click((e) => {
  e.preventDefault();

  const { type, make, model, generation, from, to, iaai, copart, archived, search, searchResult } = activeFilters;
  const api = archived ? API_ARCHIVED : API;

  if (search) {
    const url = searchResult || api.searchResult(search);
    window.open(url, '_blanc');

    return false;
  }

  let query = '';

  query += type && '&type=' + type;
  query += make ? '&make=' + make : '';
  query += model ? '&model=' + model : '';
  query += generation ? '&generation=' + generation : '';
  query += from ? '&year-from=' + from : '';
  query += to ? '&year-to=' + to : '';

  if (iaai && copart) {
    query += '&auction-type=All';
  } else {
    const auctionType = iaai ? 'IAAI' : 'Copart';
    query += '&auction-type=' + auctionType;
  }

  if (archived) {
    window.open(API_ARCHIVED.root + query, '_blanc');
  } else {
    window.open(API.root + query, '_blanc');
  }

  return false;
});

function debounce(func, wait, immediate) {
  let timeout;

  return function executedFunction() {
    const context = this;
    const args = arguments;

    const later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    const callNow = immediate && !timeout;

    clearTimeout(timeout);

    timeout = setTimeout(later, wait);

    if (callNow) func.apply(context, args);
  };
}

function isValidSearchQuery(query = '') {
  if (query.length === 17) {
    const alphanumeric = new RegExp(/^[a-z0-9]+$/i);

    return alphanumeric.test(query);
  }

  if (query.length === 8 || query.length === 9) {
    return true;
  }

  if (query.length === 10 || query.length === 11) {
    return query[1] === '-' && (query[0] === '1' || query[0] === '0');
  }

  return false;
}
