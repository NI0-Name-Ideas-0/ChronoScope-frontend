---
date: "2026-05-17 19:53"
promoted: false
---

To change language in the fullcalendar you can set the locale in the calendarOptions (see https://fullcalendar.io/docs/locale for research). You can make it load multiple locales and then switch between. Changing the translation in the buttons is bugged for german (see https://github.com/fullcalendar/fullcalendar/issues/4591). For that it's described in the issue that you can make a map for those translations and then bind calendarOptions.buttonText to them. For this project only `today,month,week` need to be translated.
