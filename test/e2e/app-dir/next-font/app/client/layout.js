'client'
import font4 from '../../fonts/font4'

export default function Root({ children }) {
  return (
    <>
      <p id="client-layout" className={font4.className}>
        {JSON.stringify(font4)}
      </p>
      {children}
    </>
  )
}
