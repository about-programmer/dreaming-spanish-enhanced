// ==UserScript==
// @name         Dreaming Spanish Enhanced
// @namespace    https://www.dreamingspanish.com
// @version      0.1
// @description  adds additional info to Dreaming Spanish progress page
// @author       https://github.com/about-programmer
// @match        https://www.dreamingspanish.com/progress
// @icon         https://www.google.com/s2/favicons?sz=64&domain=dreamingspanish.com
// @grant        none
// ==/UserScript==

Date.prototype.addDays = function(days) {
  this.setDate(this.getDate() + parseInt(days));
  return this;
};

class Activity {
  static #instance;

  constructor() {
    if (Activity.#instance) {
      throw new Error('Singleton class cannot be instantiated more than once.');
    }
    Activity.#instance = this;
  }

  static getDailyAverageForDisplayedMonth() {
    const displayedCalendar = this.getCalendarTitle();
    const loggedDays = this.#getLoggedDaysForDisplayedMonth();
    const totalTime = this.#getLoggedTimeForDisplayedMonth(loggedDays);

    if (this.#isCurrentMonthDisplayed(displayedCalendar, new Date())) {
      return totalTime / loggedDays.length;
    } else {
      const daysInMonth = this.#getDaysInMonth(displayedCalendar[0], displayedCalendar[1]);
      return totalTime / daysInMonth;
    }
  }

  static getCalendarTitle() {
    const calendarTitle = document.getElementsByClassName('ds-form-calendar__nav')[0];
    return calendarTitle.textContent.replace(' - ', ' ').split(' ');
  }

  static #getDaysInMonth(month, year) {
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return new Date(year, months.indexOf(month) + 1, 0).getDate();
  }

  static #getLoggedDaysForDisplayedMonth() {
    return Array.from(document.getElementsByClassName("ds-form-calendar__column-time"));
  }

  static #getLoggedTimeForDisplayedMonth(loggedDays) {
    return loggedDays.reduce((a, b) => a + Number(b.textContent.slice(0, -1)), 0);
  }

  static #isCurrentMonthDisplayed(displayedCalendar, current) {
    return displayedCalendar[0] === current.toLocaleString('default', { month: 'long' }) && Number(displayedCalendar[1]) === current.getFullYear()
  }
}

class Progression {
  static #instance;

  constructor() {
    if (Progression.#instance) {
      throw new Error('Singleton class cannot be instantiated more than once.');
    }
    Progression.#instance = this;
  }

  static getTotalInputTime() {
    return Number(document.getElementsByClassName('ds-overall-progression-card__info-label--bold')[1].innerText.split(' ')[0]);
  }

}

class Statistics {
  static #instance;

  constructor() {
    if (Statistics.#instance) {
      throw new Error('Singleton class cannot be instantiated more than once.');
    }
    Statistics.#instance = this;
  }

  static getDaysPracticed() {
    const cards = Array.from(document.getElementsByClassName('ds-simple-card__content'));
    const daysPracticedCard = cards.find(card => card.innerText.includes('days you practiced'));
    return Number(daysPracticedCard.innerText.split('\n')[0]);
  }
}

class Levels {
  static #instance;

  constructor() {
    if (Levels.#instance) {
      throw new Error('Singleton class cannot be instantiated more than once.');
    }
    Levels.#instance = this;
  }

  static getHoursRequiredPerLevel() {
    const levelCards = this.#getLevelCards();
    return levelCards.map(card => Number(card.getElementsByClassName('ds-level-card__label')[0].innerText.replaceAll(',', '').split(': ')[1]));
  }

  static getProgressTowardGoal() {
    const levelCards = this.#getLevelCards();
    return levelCards.map(card => card.getElementsByClassName('ds-level-card__label')[2]);
  }

  static #getLevelCards() {
    return Array.from(document.getElementsByClassName('ds-level-card--disabled'));
  }

}

class UIModifications {
  static #instance;

  constructor() {
    if (UIModifications.#instance) {
      throw new Error('Singleton class cannot be instantiated more than once.');
    }
    UIModifications.#instance = this;
  }

  static addAdditionalRatesToGoal() {
    const currentHours = Progression.getTotalInputTime();
    const inputForLevel = Levels.getHoursRequiredPerLevel();
    const goalProgress = Levels.getProgressTowardGoal();

    const goalPerDisplayedMonth = UIModifications.#calculateGoalBasedOnDisplayedMonth(currentHours, inputForLevel);
    const goalPerDaysPracticed = UIModifications.#calculateGoalBasedOnDaysPracticed(currentHours, inputForLevel);
    goalProgress.forEach((progress, index) => {
      const currentGoalRateHtml = progress.innerHTML;
      const currentDaysUntilGoal = currentGoalRateHtml.split('this level in ')[1].match(/\d+/)[0];
      const newTextForDailyGoal = currentGoalRateHtml.replace('days based', `days (${this.#calculateDayForGoal(currentDaysUntilGoal)}) based`)
      progress.innerHTML = newTextForDailyGoal;
      progress.appendChild(document.createElement('br'));
      progress.appendChild(document.createTextNode(`You'll reach this level in ${goalPerDisplayedMonth[index]} days (${this.#calculateDayForGoal(goalPerDisplayedMonth[index])}) based on your ${Activity.getCalendarTitle().join(' ')} average.`))
      progress.appendChild(document.createElement('br'));
      progress.appendChild(document.createTextNode(`You'll reach this level in ${goalPerDaysPracticed[index]} (${this.#calculateDayForGoal(goalPerDaysPracticed[index])}) days based on your average for all days practiced.`))
    });
  }

  static #calculateDayForGoal(days) {
    return new Date().addDays(days).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  static #calculateGoalBasedOnDaysPracticed(currentHours, inputForLevel) {
    const hours = currentHours / Statistics.getDaysPracticed();
    return inputForLevel.map(level => Math.round((level - currentHours) / hours));
  }

  static #calculateGoalBasedOnDisplayedMonth(currentHours, inputForLevel) {
    const minutes = Activity.getDailyAverageForDisplayedMonth();
    return inputForLevel.map(level => Math.round(((level - currentHours) * 60) / minutes));
  }
}

window.addEventListener("load", () => UIModifications.addAdditionalRatesToGoal());
