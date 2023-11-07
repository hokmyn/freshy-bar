const API_URL = 'https://brass-saber-talon.glitch.me/';

const price = {
  Клубника: 60,
  Банан: 50,
  Манго: 70,
  Киви: 55,
  Маракуйя: 90,
  Яблоко: 45,
  Мята: 50,
  Лед: 10,
  Биоразлагаемый: 20,
  Пластиковый: 0
}

const cartDataController = {
  get() {
    return JSON.parse(localStorage.getItem('freshyBarCart') || '[]');
  },
  add(item) {
    const cartData = this.get();
    item.idls = Math.random().toString(36).substring(2, 8);
    cartData.push(item);
    localStorage.setItem('freshyBarCart', JSON.stringify(cartData));
  },
  remove() {
    const cartData = this.get();
    const index = cart.findIndex(item => item.idls === idls);
    if(index !== -1) {
      cartData.splice(index, 1);
    }
    localStorage.setItem('freshyBarCart', JSON.stringify(cartData));
  },
  clear() {
    localStorage.removeItem('freshyBarCart');
  }
}

const getData = async () => {
  const resp = await fetch(API_URL + 'api/goods');

  const data = await resp.json();
  return data;
}

const createCard = item => {
  const cocktail = document.createElement('article');
  cocktail.classList.add('coctail');

  cocktail.innerHTML = `
    <img
      src="${API_URL}${item.image}"
      alt="коктейль ${item.title}"
      class="coctail__img"
      width="256" height="304"
    >
    <div class="coctail__content">
      <div class="coctail__text">
        <h3 class="coctail__title">${item.title}</h3>
        <p class="coctail__price text-red">${item.price} ₽</p>
        <p class="coctail__size">${item.size}</p>
      </div>

      <button class="btn coctail__btn coctail__btn_add" data-id="${item.id}">Добавить</button>
    </div>
  `;

  return cocktail;
};

const scrollService = {
  scrollPos: 0,
  disabledScroll() {
    this.scrollPos = window.scrollY;
    document.documentElement.style.scrollBehavior = 'auto';
    document.body.style.cssText = `
      overflow: hidden;
      position: fixed;
      top: -${this.scrollPos}px;
      left: 0;
      height: 100vh;
      width: 100vw;
      padding-right: ${window.innerWidth - document.body.offsetWidth}
    `;
  },
  enabledScroll() {
    document.body.style.cssText = '';
    window.scroll({ top: this.scrollPos });
    document.documentElement.style.scrollBehavior = '';
  },
};

const modalController = ({modal, btnOpen, time = 300, open, close}) => {
  const btnElems = document.querySelectorAll(btnOpen);
  const modalElem = document.querySelector(modal);

  modalElem.style.cssText = `
    display: flex;
    visibility: hidden;
    opacity: 0;
    transition: opacity ${time}ms ease-in-out;
  `;
  
  const closeModal = (event) => {
    const target = event.target;
    const code = event.code;

    if(event === "close" || target === modalElem || code === 'Escape') {
      modalElem.style.opacity = 0;

      setTimeout(() => {
        modalElem.style.visibility = 'hidden';
        scrollService.enabledScroll();

        if(close) {
          close();
        }
      }, time);

      window.removeEventListener('keydown', closeModal);
    }
  };

  const openModal = (e) => {
    if(open) {
      open({ btn: e.target });
    };
    modalElem.style.visibility = 'visible';
    modalElem.style.opacity = 1;
    window.addEventListener('keydown', closeModal);
    scrollService.disabledScroll();
  };
  
  btnElems.forEach(btnElem => {
    btnElem.addEventListener('click', openModal);
  });
  
  modalElem.addEventListener('click', closeModal);

  modalElem.closeModal = closeModal;
  modalElem.openModal = openModal;

  return { openModal, closeModal };
};

const getFormData = (form) => {
  const formData = new FormData(form);
  const data = {};
  for (const [name, value] of formData.entries()) {
    if(data[name]) {
      if(!Array.isArray(data[name])) {
        data[name] = [data[name]];
      }
      data[name].push(value);
    } else {
      data[name] = value;
    }
  }
  return data;
}

const calculateTotalPrice = (form, startPrice) => {
  let totalPrice = startPrice;

  const data = getFormData(form);

  if(Array.isArray(data.ingrs)) {
    data.ingrs.forEach(item => {
      totalPrice += price[item] || 0;
    });
  } else {
    totalPrice += price[data.ingrs] || 0;
  }

  if(Array.isArray(data.topping)) {
    data.topping.forEach(item => {
      totalPrice += price[item] || 0;
    });
  } else {
    totalPrice += price[data.topping] || 0;
  }

  totalPrice += price[data.cup] || 0;

  return totalPrice;
};

const formControl = (form, cb) => {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = getFormData(form);
    cartDataController.add(data);

    if(cb) {
      cb();
    }
  });
};

const calculateMakeYourOwn = () => {
  const modalMakeOwn = document.querySelector(".modal_make-your-own");
  const makeAddBtn = modalMakeOwn.querySelector(".make__add-btn");
  const makeInputTitle = modalMakeOwn.querySelector(".make__input-title");
  const formMakeOwn = modalMakeOwn.querySelector(".make__form_make-your-own");
  const makeInputPrice = formMakeOwn.querySelector(".make__input_price");
  const makeTotalPrice = formMakeOwn.querySelector(".make__total-price");

  const handlerChange = () => {
    const totalPrice = calculateTotalPrice(formMakeOwn, 150);
    const data = getFormData(formMakeOwn);
    if (data.ingrs) {
      const ingrs = Array.isArray(data.ingrs)
        ? data.ingrs.join(", ") 
        : data.ingrs;

      makeInputTitle.value = `Конструктор ${ingrs}`;
      makeAddBtn.disabled = false;
    } else {
      makeAddBtn.disabled = true;
    }
    makeInputPrice.value = totalPrice;
    makeTotalPrice.textContent = `${totalPrice} ₽`;
  };

  formMakeOwn.addEventListener("change", handlerChange);
  formControl(formMakeOwn, () => {
    modalMakeOwn.closeModal("close");
  });
  handlerChange();

  const resetForm = () => {
    makeTotalPrice.textContent = '';
    formMakeOwn.reset();
    makeAddBtn.disabled = true;
  };

  return { resetForm };
};

const calculateAdd = () => {
  const modalAdd = document.querySelector(".modal_add");
  const formAdd = document.querySelector(".make__form_add");
  const makeTitle = modalAdd.querySelector(".make__title");
  const makeInputTitle = modalAdd.querySelector(".make__input-title");
  const makeTotalPrice = modalAdd.querySelector(".make__total-price");
  const makeInputStartPrice = modalAdd.querySelector(".make__input-start-price")
  const makeInputPrice = modalAdd.querySelector(".make__input-price");
  const makeTotalSize = modalAdd.querySelector(".make__total-size");
  const makeInputSize = modalAdd.querySelector(".make__input-size");

  const handlerChange = () => {
    const totalPrice = calculateTotalPrice(formAdd, +makeInputStartPrice.value);
    makeTotalPrice.innerHTML = totalPrice;
    makeInputPrice.value = totalPrice;
  };
  formAdd.addEventListener('change', handlerChange);
  formControl(formAdd, () => {
    modalAdd.closeModal("close");
  });

  const fillInForm = data => {
    makeTitle.textContent = data.title;
    makeInputTitle.value = data.title;
    makeTotalPrice.textContent = `${data.price}₽`;
    makeInputPrice.value = data.price;
    makeInputStartPrice.value = data.price;
    makeTotalSize.textContent = data.size;
    makeInputSize.value = data.size;
    handlerChange();
  };

  const resetForm = () => {
    makeTitle.textContent = '';
    makeTotalPrice.textContent = '';
    makeTotalSize.textContent = '';
    formAdd.reset();
  };
  return { fillInForm, resetForm};
}

const createCartItem = (item) => {
  const li = document.createElement('li');
  li.classList.add("order__item");
  li.innerHTML = `
    <img src="images/cup_3.png"
      alt="${item.title}"
      class="order__img"
    >
    <div class="order__info">
      <h3 class="order__subtitle">${item.title}</h3>
      <ul class="order__info-list">
        <li class="order__info-item">${item.size}</li>
        ${item.topping
          ? (Array.isArray(item.topping))
            ? item.topping.map(topping => `<li class="order__info-item">${topping}</li>`)
            : `<li class="order__info-item">${item.topping}</li>`
          : ""
        }
      </ul>
    </div>
    <button
      class="order__item-del"
      aria-label="удалить коктейль из корзины"
      data-idls="${item.idls}"
    >X</button>
    <p class="order__item-price">${item.price}&nbsp;₽</p>
  `;

  return li;
};

const renderCart = () => {
  const modalOrder = document.querySelector(".modal_order");

  const orderCount = modalOrder.querySelector(".order__count");
  const orderList = modalOrder.querySelector(".order__list");
  const orderPriceTotal = modalOrder.querySelector(".order__price-total");
  const orderForm = modalOrder.querySelector(".order__form");

  const orderListData = cartDataController.get();

  orderList.textContent = "";
  orderCount.textContent = `(${orderListData.length})`;

  orderListData.forEach(item => {
    orderList.append(createCartItem(item));
  });

  orderPriceTotal.textContent = `${orderListData.reduce((acc, item) => acc + +item.price, 0)} ₽`;

  orderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!orderListData.length) {
      alert("Корзина пустая");
      return;
    }

    const data = getFormData(orderForm);

    const resp = await fetch(`${API_URL}api/order`, {
      method: "POST",
      body: JSON.stringify({
        ...data,
        products: orderListData,
      }),
      headers: {
        "Content-Type": "application/json",
      }
    });
    const {msg} = await resp.json();
    alert(msg);
    cartDataController.clear();
    orderForm.reset();
    modalOrder.closeModal("close");
  });
};

const init = async () => {

  modalController({
    modal: '.modal_order',
    btnOpen: '.header__btn-order',
    open: renderCart
  });

  const {resetForm: resetFormMakeYourOwn} = calculateMakeYourOwn();

  modalController({
    modal: '.modal_make-your-own',
    btnOpen: '.coctail__btn_make',
    close: resetFormMakeYourOwn
  });

  const goodsListElem = document.querySelector('.goods__list');
  const data = await getData();

  const cardsCocktails = data.map((item) => {
    const li = document.createElement('li');
    li.classList.add('goods__item');
    li.append(createCard(item));

    return li;
  });

  goodsListElem.append(...cardsCocktails);

  const { fillInForm: fillInFormAdd, resetForm: resetFormAdd } = calculateAdd();

  modalController({
    modal: '.modal_add',
    btnOpen: '.coctail__btn_add',
    open({btn}) {
      const id = btn.dataset.id;
      const item = data.find(el => el.id.toString() === id);
      fillInFormAdd(item);
    },
    close: resetFormAdd
  });
}

init();