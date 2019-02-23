// just for tests
import { differenceInSeconds } from 'date-fns';

export default () => {
  const feeds = document.querySelectorAll('.feed');

  feeds.forEach((feed) => {
    const h2 = feed.firstElementChild;
    const arr = h2.textContent.split(' ');
    const expected = Number(arr[arr.length - 2]);
    const values = [...feed.querySelectorAll('a')];
    const dates = values.map(v => v.textContent.split(' ')[2]);
    const isOk = dates.reduce((acc, v, i) => {
      // console.log(
      //   differenceInSeconds(v, dates[i + 1]), '<<diff',
      //   expected, '<<expected',
      //   acc, '<<acc',
      // );
      if (!acc) {
        return false;
      }
      if (!dates[i + 1]) {
        return true;
      }
      return differenceInSeconds(v, dates[i + 1]) === expected;
    }, true);
    console.log(`${h2.textContent}<<<>>>${isOk ? 'true' : 'FALSE!!!!!!!!!!!!!!!!!!!!!!!!!!!'}`);
  });
};
