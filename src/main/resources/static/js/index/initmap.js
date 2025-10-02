window.initMap = function () {
  window.map = new google.maps.Map(document.getElementById('map'), {
    center: { lat: 35.68, lng: 139.76 },
    zoom: 12
  });
  window.dispatchEvent(new Event('map-ready'));
  if (document.getElementById('disasterToggle')?.checked) {
    window.DisasterFeature?.enable(window.map);
  }
};