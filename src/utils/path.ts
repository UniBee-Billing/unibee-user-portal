const trimStartSlash = (path: string) => path.replace(/^\//, '')
const trimEndSlash = (path: string) => path.replace(/\/$/, '')

// Extract base path name from URL path
// Input path: /path/foo/bar
// Output: path
export const basePathName = (path: string) => {
  const [basePathName] = trimStartSlash(path).split('/')

  return basePathName
}

export const trimBasePath = (basePath: string, path: string) => {
  const basePathName = trimStartSlash(basePath)
  const pathWithoutBasePath = path.replace(new RegExp(`^/${basePathName}`), '')

  return pathWithoutBasePath
}

export const withBasePath = (basePath: string, path: string) => {
  const baseURWithoutEndSlash = trimEndSlash(basePath)
  const pathWithoutStartSlash = trimStartSlash(path)

  return [baseURWithoutEndSlash, pathWithoutStartSlash].join('/')
}

export const withEnvBasePath = (path: string) =>
  withBasePath(import.meta.env.BASE_URL, path)

export const trimEnvBasePath = (path: string) =>
  trimBasePath(import.meta.env.BASE_URL, path)

export const withRootPath = (path: string) => withBasePath('/', path)
