import { Observable } from 'rxjs'

export function toArray<T>(obs: Observable<T>): T[] {
   const array: T[] = []
   obs.subscribe(val => array.push(val))
   return array
}
