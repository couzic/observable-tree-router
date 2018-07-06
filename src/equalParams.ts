export function equalParams(keys: string[], a: any = {}, b: any = {}) {
   const keyCount = keys.length
   if (keyCount === 0) return true
   let toReturn = true
   for (let i = 0; i < keyCount; i++) {
      const key = keys[i]
      if (a[key] !== b[key]) {
         toReturn = false
         break
      }
   }
   return toReturn
}
