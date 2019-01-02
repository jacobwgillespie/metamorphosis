import {StreamOperator} from '../types'

export function pipe<T>(source: AsyncIterable<T>): AsyncIterable<T>
export function pipe<T, A>(source: AsyncIterable<T>, op1: StreamOperator<T, A>): AsyncIterable<A>
export function pipe<T, A, B>(
  source: AsyncIterable<T>,
  op1: StreamOperator<T, A>,
  op2: StreamOperator<A, B>,
): AsyncIterable<B>
export function pipe<T, A, B, C>(
  source: AsyncIterable<T>,
  op1: StreamOperator<T, A>,
  op2: StreamOperator<A, B>,
  op3: StreamOperator<B, C>,
): AsyncIterable<C>
export function pipe<T, A, B, C, D>(
  source: AsyncIterable<T>,
  op1: StreamOperator<T, A>,
  op2: StreamOperator<A, B>,
  op3: StreamOperator<B, C>,
  op4: StreamOperator<C, D>,
): AsyncIterable<D>
export function pipe<T, A, B, C, D, E>(
  source: AsyncIterable<T>,
  op1: StreamOperator<T, A>,
  op2: StreamOperator<A, B>,
  op3: StreamOperator<B, C>,
  op4: StreamOperator<C, D>,
  op5: StreamOperator<D, E>,
): AsyncIterable<E>
export function pipe<T, A, B, C, D, E, F>(
  source: AsyncIterable<T>,
  op1: StreamOperator<T, A>,
  op2: StreamOperator<A, B>,
  op3: StreamOperator<B, C>,
  op4: StreamOperator<C, D>,
  op5: StreamOperator<D, E>,
  op6: StreamOperator<E, F>,
): AsyncIterable<F>
export function pipe<T, A, B, C, D, E, F, G>(
  source: AsyncIterable<T>,
  op1: StreamOperator<T, A>,
  op2: StreamOperator<A, B>,
  op3: StreamOperator<B, C>,
  op4: StreamOperator<C, D>,
  op5: StreamOperator<D, E>,
  op6: StreamOperator<E, F>,
  op7: StreamOperator<F, G>,
): AsyncIterable<G>
export function pipe<T, A, B, C, D, E, F, G, H>(
  source: AsyncIterable<T>,
  op1: StreamOperator<T, A>,
  op2: StreamOperator<A, B>,
  op3: StreamOperator<B, C>,
  op4: StreamOperator<C, D>,
  op5: StreamOperator<D, E>,
  op6: StreamOperator<E, F>,
  op7: StreamOperator<F, G>,
  op8: StreamOperator<G, H>,
): AsyncIterable<H>
export function pipe<T, A, B, C, D, E, F, G, H, I>(
  source: AsyncIterable<T>,
  op1: StreamOperator<T, A>,
  op2: StreamOperator<A, B>,
  op3: StreamOperator<B, C>,
  op4: StreamOperator<C, D>,
  op5: StreamOperator<D, E>,
  op6: StreamOperator<E, F>,
  op7: StreamOperator<F, G>,
  op8: StreamOperator<G, H>,
  op9: StreamOperator<H, I>,
): AsyncIterable<I>
export function pipe<T, A, B, C, D, E, F, G, H, I, J>(
  source: AsyncIterable<T>,
  op1: StreamOperator<T, A>,
  op2: StreamOperator<A, B>,
  op3: StreamOperator<B, C>,
  op4: StreamOperator<C, D>,
  op5: StreamOperator<D, E>,
  op6: StreamOperator<E, F>,
  op7: StreamOperator<F, G>,
  op8: StreamOperator<G, H>,
  op9: StreamOperator<H, I>,
  op10: StreamOperator<I, J>,
): AsyncIterable<J>

export function pipe<TSource, TResult>(
  source: AsyncIterable<TSource>,
  ...operations: StreamOperator<TSource, TResult>[]
): AsyncIterable<TResult> {
  if (operations.length === 0) {
    return (source as unknown) as AsyncIterable<TResult>
  }

  return operations.reduce(
    (prev: any, fn: StreamOperator<TSource, TResult>) => fn(prev),
    source as any,
  )
}
