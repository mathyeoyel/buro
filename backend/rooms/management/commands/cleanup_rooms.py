from django.core.management.base import BaseCommand

from rooms.cleanup import cleanup_live_rooms


class Command(BaseCommand):
    help = "End expired or empty live rooms (safe to run repeatedly)."

    def handle(self, *args, **options):
        ended = cleanup_live_rooms()
        self.stdout.write(self.style.SUCCESS(f"Ended {ended} room(s)."))
