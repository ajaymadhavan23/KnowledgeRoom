import { Notification } from "../models/Notification.js";

export async function createNotification({ recipient, fromUser, post, type }) {
  if (!recipient || recipient.toString() === fromUser.toString()) {
    return null;
  }

  return Notification.create({ recipient, fromUser, post, type });
}
