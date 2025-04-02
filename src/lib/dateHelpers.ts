export const presets = [
    { label: "Aujourd'hui", dateRange: { from: new Date(), to: new Date() } },
    {
      label: "7 derniers jours",
      dateRange: {
        from: new Date(new Date().setDate(new Date().getDate() - 7)),
        to: new Date(),
      },
    },
    {
      label: "30 derniers jours",
      dateRange: {
        from: new Date(new Date().setDate(new Date().getDate() - 30)),
        to: new Date(),
      },
    },
    {
      label: "3 derniers mois",
      dateRange: {
        from: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        to: new Date(),
      },
    },
    {
      label: "6 derniers mois",
      dateRange: {
        from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        to: new Date(),
      },
    },
    {
      label: "Mois en cours",
      dateRange: { from: new Date(new Date().setDate(1)), to: new Date() },
    },
    {
      label: "Année en cours",
      dateRange: {
        from: new Date(new Date().setFullYear(new Date().getFullYear(), 0, 1)),
        to: new Date(),
      },
    },
    {
        label: "Année passée",
        dateRange: {
            from: new Date(new Date().setFullYear(new Date().getFullYear() - 1, 0, 1)),
            to: new Date(),
        },
    },
    {
      label: "Mois précédent",
      dateRange: {
        from: new Date(
          new Date().setFullYear(
            new Date().getFullYear(),
            new Date().getMonth() - 1,
            1,
          ),
        ),
        to: new Date(
          new Date().setFullYear(
            new Date().getFullYear(),
            new Date().getMonth(),
            0,
          ),
        ),
      },
    },
    {
      label: "Semaine précédente",
      dateRange: {
        from: new Date(
          new Date().setDate(new Date().getDate() - new Date().getDay() - 6),
        ),
        to: new Date(
          new Date().setDate(new Date().getDate() - new Date().getDay()),
        ),
      },
    },
    {
      label: "30 prochains jours",
      dateRange: {
        from: new Date(),
        to: new Date(new Date().setDate(new Date().getDate() + 29)),
      },
    },
    {
      label: "Cette semaine",
      dateRange: {
        from: new Date(
          new Date().setDate(new Date().getDate() - new Date().getDay()),
        ),
        to: new Date(
          new Date().setDate(new Date().getDate() - new Date().getDay() + 6),
        ),
      },
    },
   
  ]

  export const futurePresets = [
    {
      label: "7 Prochains jours",
      dateRange: {
        from: new Date(),
        to: new Date(new Date().setDate(new Date().getDate() + 6)),
      },
    },
    {
      label: "30 Prochains jours",
      dateRange: {
        from: new Date(),
        to: new Date(new Date().setDate(new Date().getDate() + 29)),
      },
    },
    {
      label: "3 Prochains mois",
      dateRange: {
        from: new Date(),
        to: new Date(new Date().setMonth(new Date().getMonth() + 2)),
      },
    },
    {
      label: "6 Prochains mois",
      dateRange: {
        from: new Date(),
        to: new Date(new Date().setMonth(new Date().getMonth() + 5)),
      },
    },
    {
      label: "Année prochaine",
      dateRange: {
        from: new Date(),
        to: new Date(new Date().setFullYear(new Date().getFullYear() + 1, 0, 1)),
      },
    },
  ]
