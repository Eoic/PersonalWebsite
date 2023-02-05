from .models import Entry
from django.shortcuts import render
from django.views.generic import TemplateView


class IndexView(TemplateView):
    entry_model = Entry
    template_name = 'index.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['entries'] = self.entry_model.objects.all()
        return context