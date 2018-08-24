export const fetchOk = async (...args) => {
  const res = await fetch(...args);
  return res.ok ? res : Promise.reject(res);
};
