exports.getPackageStatus = async (apiClient) => {
  if(undefined===apiClient) return [];
  
  let registerpackagetxs = await apiClient.transactions.get({ type: '20' });
  let packages = registerpackagetxs.data;
  // .map(
  //   registerpackagetx => { return registerpackagetx.asset}
  // )
  
  console.log("got packages: %o", packages);
  return packages;
}
