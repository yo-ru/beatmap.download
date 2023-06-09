const chartSettings = {
  download: {
    theme: {
      mode: 'dark',
      palette: 'palette8',
      monochrome: {
        enabled: false,
        color: '#7171ff',
        shadeTo: 'light',
        shadeIntensity: 1
      },
    },
    series: [],
    chart: {
      width: "200%",
      background: "#1E1E2E",
      fontFamily: 'Uni Sans',
      type: 'line',
      zoom: {
        enabled: false
      },
      toolbar: {
        show: false
      },
    },
    stroke: {
      curve: 'smooth'
    },
    dataLabels: {
      enabled: false
    },
    title: {
      text: '',
      align: 'center'
    },
    xaxis: {
      type: 'category',
    },
    yaxis: {
      decimalsInFloat: 0,

      labels: {
        formatter: (value, _index) => {
          return `${(value / 1000).toFixed(2)}s`
        }
      }
    },
    tooltip: {
      inverseOrder: true,
      y: {
        formatter: (value, _options) => {
          return `${(value / 1000).toFixed(2)}s`
        }
      }
    },
    responsive: [{
      breakpoint: 1024,
      options: {
        chart: {
          width: "140%"
        }
      }
    }],
    legend: {
      onItemClick: {
        toggleDataSeries: false
      }
    }
  },
  latency: {
    theme: {
      mode: 'dark',
      palette: 'palette8',
      monochrome: {
        enabled: false,
        color: '#7171ff',
        shadeTo: 'light',
        shadeIntensity: 1
      },
    },
    series: [],
    chart: {
      width: "200%",
      background: "#1E1E2E",
      fontFamily: 'Uni Sans',
      type: 'line',
      zoom: {
        enabled: false
      },
      toolbar: {
        show: false
      },
    },
    stroke: {
      curve: 'smooth'
    },
    dataLabels: {
      enabled: false
    },
    title: {
      text: '',
      align: 'center'
    },
    xaxis: {
      type: 'category',
    },
    tooltip: {
      inverseOrder: true,
      y: {
        formatter: (value, options) => {
          return `${value}ms`
        }
      }
    },
    responsive: [{
      breakpoint: 1024,
      options: {
        chart: {
          width: "140%"
        }
      }
    }],
    legend: {
      onItemClick: {
        toggleDataSeries: false
      }
    }
  },
  uptime: {
    theme: {
      mode: 'dark',
      palette: 'palette8',
      monochrome: {
        enabled: false,
        color: '#7171ff',
        shadeTo: 'light',
        shadeIntensity: 1
      },
    },
    series: [],
    chart: {
      width: "200%",
      background: "#1E1E2E",
      fontFamily: 'Uni Sans',
      type: 'bar',
      zoom: {
        enabled: false
      },
      toolbar: {
        show: false
      },
    },
    dataLabels: {
      enabled: false
    },
    title: {
      text: 'Uptime % (all time)',
      align: 'center'
    },
    yaxis: {
      max: 100,
      min: 50,
      decimalsInFloat: 0,

      labels: {
        formatter: (value, index) => {
          return `${value.toFixed(2)}%`
        }
      }
    },
    xaxis: {
      categories: [''],
    },
    tooltip: {
      y: {
        formatter: (value, options) => {
          return `${value.toFixed(2)}%`
        }
      }
    },
    responsive: [{
      breakpoint: 1024,
      options: {
        chart: {
          width: "140%"
        }
      }
    }],
    legend: {
      onItemClick: {
        toggleDataSeries: false
      }
    }
  }
};

const charts = [];

class LatencyChart {

  constructor({
    selector,
    dataType,
    option,
    data,
    title
  }) {
    this.selector = selector;
    this.option = option;
    this.dataType = dataType;
    this.data = data;
    this.title = title;
    this.chart = new ApexCharts(document.querySelector(selector), chartSettings[this.option]);
    this.chart.render()

  }

  updateSeries(json) {
    let series = []
    Object.entries(json).forEach(([mirror, data]) => {
      let categories = data[this.dataType].time.splice(data[this.dataType].time.length - 12, data[this.dataType].time.length);
      categories = categories.map((time) => {
        return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-(Math.floor((Date.now() / 1000 - time) / 60)), "minutes")
      });

      const dataa = data[this.dataType][this.data].splice(data[this.dataType][this.data].length - 12, data[this.dataType][this.data].length);
      series.push({
        name: mirror,
        type: 'line',
        data: dataa
      });

      this.chart.updateSeries(series)
      this.chart.updateOptions({
        title: {
          text: this.title,
          align: 'center'
        },
        xaxis: {
          categories: categories
        }
      })
    });
  }
}

const initSeries = async (apiUrl, json, allDataJson) => {
  updateUptimeSeries(json);
  charts.forEach(chart => chart.updateSeries(allDataJson))
  setTimeout(() => reloadSeries(apiUrl), 60 * 1000 * 1)
}

const reloadSeries = async (apiUrl) => {
  const avgResp = await fetch(`${apiUrl}/servers/average`)
  const upResp = await fetch(`${apiUrl}/servers`)
  const avgJson = await avgResp.json();
  const upJson = await upResp.json();

  // sort json by uptime
  const sortedAvgJson = Object.fromEntries(
    Object.entries(avgJson).sort(([, a], [, b]) => ((a.search.average.uptime + a.download.average.uptime + a.status.average.uptime) - (b.search.average.uptime + b.download.average.uptime + b.status.average.uptime))).reverse()
  );

  const sortedUpJson = Object.fromEntries(
    Object.entries(upJson).sort(([, a], [, b]) => ((a.search.average.uptime + a.download.average.uptime + a.status.average.uptime) - (b.search.average.uptime + b.download.average.uptime + b.status.average.uptime))).reverse()
  );

  updateUptimeSeries(sortedAvgJson);
  charts.forEach(chart => chart.updateSeries(sortedUpJson))
  setTimeout(() => reloadSeries(apiUrl), 60 * 1000 * 1)
}

const updateUptimeSeries = (json) => {
  let series = []
  Object.entries(json).forEach(([mirror, data]) => {
    series.push({
      name: mirror,
      data: [((data.download.average.uptime + data.search.average.uptime) / 2) * 100]
    })
  });
  uptimeChart.updateSeries(series)
};

var uptimeChart = new ApexCharts(document.querySelector("#uptime-chart"), chartSettings.uptime)
uptimeChart.render()

charts.push(new LatencyChart({
  selector: "#search-chart",
  dataType: "search",
  option: "latency",
  data: "latency",
  title: "Search Time (last hour)"
}));
charts.push(new LatencyChart({
  selector: "#downloadtime-chart",
  dataType: "download",
  option: "download",
  data: "downloadTime",
  title: "Download Speed (last hour) (98.7MB)"
}));
charts.push(new LatencyChart({
  selector: "#status-chart",
  dataType: "status",
  option: "latency",
  data: "latency",
  title: "Latency (last hour)"
}));