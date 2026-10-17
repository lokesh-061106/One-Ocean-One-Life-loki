from django import forms
from django.contrib.gis import forms as gis_forms


class RichTextWidget(forms.Textarea):
    """Textarea upgraded to a WYSIWYG HTML editor by ``o3l/js/rich_text_editor.js``."""

    class Media:
        css = {"all": ("o3l/css/rich_text_editor.css",)}
        js = ("o3l/js/rich_text_editor.js",)

    def __init__(self, attrs=None):
        default_attrs = {
            "class": "o3l-richtext-source",
            "rows": 12,
            "spellcheck": "true",
        }
        if attrs:
            default_attrs.update(attrs)
        super().__init__(default_attrs)

    def get_context(self, name, value, attrs):
        context = super().get_context(name, value, attrs)
        context["widget"]["editor"] = True
        return context


class LocalOSMWidget(gis_forms.OSMWidget):
    """OSM map widget loading OpenLayers from local static files (no CDN).

    The stock OSMWidget pulls ol.js/ol.css from cdn.jsdelivr.net, which fails
    when the admin is opened from a network or browser profile that blocks
    third-party CDNs — the Location map then stays blank. This widget serves
    the exact same OpenLayers v7.2.2 build from ``static/gis/vendor/ol/``.

    Empty maps open over the Tamil Nadu coast instead of Django's France
    default, so an unsaved location is still set in the right part of the
    world: click on the map, then Save.
    """

    default_lon = 80
    default_lat = 13
    default_zoom = 8

    @property
    def media(self):
        return forms.Media(
            css={"all": ("gis/vendor/ol/ol.css", "gis/css/ol3.css")},
            js=("gis/vendor/ol/ol.js", "gis/js/OLMapWidget.js"),
        )
