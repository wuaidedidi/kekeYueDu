const bcrypt = require('bcryptjs');

(async () => {
  try {
    const pwd = 'Pass1234';
    // 尝试 await 异步 hash（如果不支持，将返回 undefined 或抛错）
    const asyncHash = await bcrypt.hash(pwd, 12);
    console.log('asyncHash:', asyncHash);

    // 同步 hash/compare（bcryptjs 确认支持）
    const syncHash = bcrypt.hashSync(pwd, 12);
    console.log('syncHash:', syncHash);

    const ok1 = bcrypt.compareSync(pwd, syncHash);
    console.log('compareSync ok1:', ok1);

    // 如果 asyncHash 存在，比较看看
    if (asyncHash) {
      const ok2 = bcrypt.compareSync(pwd, asyncHash);
      console.log('compareSync ok2:', ok2);
    }
  } catch (e) {
    console.error('bcryptjs test error:', e);
  }
})();