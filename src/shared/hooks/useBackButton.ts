import { useWebApp } from '@vkruglikov/react-telegram-web-app'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function useBackButton() {
  const webapp = useWebApp()
  const navigate = useNavigate()

  useEffect(() => {
    webapp.ready()

    const backButton = webapp.BackButton
    backButton.show()
    backButton.onClick(function () {
      backButton.hide()
    })

    const handleBack = () => {
      if (window.history.length > 1) {
        navigate(-1)
      } else {
        navigate('/')
      }
      backButton.hide()
    }

    webapp.onEvent('backButtonClicked', handleBack)
    return () => {
      webapp.offEvent('backButtonClicked', handleBack)
    }
  }, [navigate, webapp])
}

export default useBackButton
