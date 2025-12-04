import type { FC } from 'react'

export const Footer: FC = () => {
  const year = new Date().getFullYear()

  return (
    <footer className="footer">
      <p>
        © <span>{year}</span> Senior Software Developer&apos;s CPD
        <br />
        mail:{' '}
        <a href="mailto:soromiso@gmail.com">
          soromiso@gmail.com
        </a>
      </p>
    </footer>
  )
}
