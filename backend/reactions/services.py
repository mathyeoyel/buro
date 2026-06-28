from rooms.services import assert_can_interact_in_room

from .models import RoomReaction


def create_room_reaction(user, room, reaction_type: str):
    assert_can_interact_in_room(user, room)
    return RoomReaction.objects.create(
        room=room,
        user=user,
        reaction_type=reaction_type,
    )
