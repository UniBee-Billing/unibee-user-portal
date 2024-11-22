import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const useCountdown = (
  initialVal: number
): [number, boolean, () => void, () => void] => {
  const [currentVal, setCurrentVal] = useState(initialVal)
  const [counting, setCounting] = useState(false)
  const countdownReqId = useRef(0)

  const start = () => {
    const valBK = currentVal
    let val = currentVal
    let lastTime = new Date().getTime()
    setCounting(true)
    ;(function timer() {
      countdownReqId.current = requestAnimationFrame(timer)
      const currentTime = new Date().getTime()
      if (currentTime - lastTime >= 1000) {
        lastTime = currentTime
        val--
        val > 0 && setCurrentVal(val) // I don't want to use many if/else checks
        val == 0 && setCounting(false)
        val < 0 &&
          (setCurrentVal(valBK), cancelAnimationFrame(countdownReqId.current))
      }
    })()
  }

  // after a stop, start() will start with initialValue, not from leftover value, 'resume' not implemented yet
  const stop = () => {
    cancelAnimationFrame(countdownReqId.current)
    setCurrentVal(initialVal)
    setCounting(false)
    countdownReqId.current = 0
  }
  return [currentVal, counting, start, stop]
}

const usePagination = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const pageNum = parseInt(searchParams.get('page') ?? '0')
  const [page, setPage] = useState(
    isNaN(pageNum) || pageNum <= 0 ? 0 : pageNum - 1
  )
  const onPageChange: (page: number, pageSize: number) => void = (
    page: number,
    pageSize: number
  ) => {
    setPage(page - 1)
    setSearchParams({ page: page + '' })
  }

  // some tables are part of a page, no need to set searchParams on URL
  const onPageChangeNoParams: (page: number, pageSize: number) => void = (
    page: number,
    pageSize: number
  ) => {
    setPage(page - 1)
  }

  return { page, onPageChange, onPageChangeNoParams }
}

export { useCountdown, usePagination }
