import { OperationResult, definePlugin, ClientPluginOperation } from 'villus'


// From the docs:
// You can check the source code for the cache plugin and use it as a reference to build your own

// So I just copied the original cache plugin code and tried to make my own ssr compatible version
// You can see that the ClientPluginOperation is declared but not exported

interface ResultCache { [k: string]: OperationResult }
export const cache = (initialCache?: ResultCache, ssrOutlet?: (result: ResultCache) => void) => {
  const resultCache: ResultCache = initialCache || {}

  function setCacheResult({ key }: ClientPluginOperation, result: OperationResult) {
    resultCache[key] = result
    if (ssrOutlet) ssrOutlet(resultCache)
  }

  function getCachedResult({ key }: ClientPluginOperation): OperationResult | undefined {
    return resultCache[key]
  }

  return definePlugin(({ afterQuery, useResult, operation }) => {
    if (operation.type !== 'query' || operation.cachePolicy === 'network-only')
      return

    // Set the cache result after query is resolved
    afterQuery((result) => {
      setCacheResult(operation, result)
    })

    // Get cached item
    const cachedResult = getCachedResult(operation)
    if (operation.cachePolicy === 'cache-only')
      return useResult(cachedResult || { data: null, error: null }, true)

    // if exists in cache, terminate with result
    if (cachedResult)
      return useResult(cachedResult, operation.cachePolicy === 'cache-first')
  })
}
