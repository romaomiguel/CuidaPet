import { useState, useCallback, useRef } from 'react'

export function useDebounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): T {
  const timeout = useRef<ReturnType<typeof setTimeout>>()

  return useCallback(
    (...args: Parameters<T>) => {
      clearTimeout(timeout.current)
      timeout.current = setTimeout(() => fn(...args), delay)
    },
    [fn, delay],
  ) as T
}

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  const timeout = useRef<ReturnType<typeof setTimeout>>()

  const update = useCallback(
    (val: T) => {
      clearTimeout(timeout.current)
      timeout.current = setTimeout(() => setDebouncedValue(val), delay)
    },
    [delay],
  )

  // Trigger update whenever value changes
  update(value)

  return debouncedValue
}
