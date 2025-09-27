# Team Collab Fullstack – Wireframe Descriptions

## 1. Login/Register Page

**Purpose:** Allow users to log in or create an account.

- **Logo & App Name** centered at top
- **Login Form:**
  - Email input
  - Password input
  - Login button
  - “Forgot password?” link
  - Divider: “OR”
  - Google SSO button
- **Link:** “Don’t have an account? Register”

---

## 2. Dashboard/Main

**Purpose:** Main landing after login, team/project navigation.

- **Sidebar (left)**
  - Profile picture (mini)
  - List: Teams → Projects → Channels
  - “+” button for creating team/project/channel
- **Top Bar**
  - Search bar
  - Notification bell (with count)
  - Profile/avatar dropdown (link to Profile/Admin/Logout)
- **Main Area**
  - By default: Activity Feed (recent messages, task updates)
  - If project/channel selected: Loads chat/task view

---

## 3. Channel/Chat Page

**Purpose:** Real-time messaging in a selected channel.

- **Header**
  - Channel/Project name
  - Channel settings button
- **Main Chat Area**
  - List of messages (bubble style, sender, time, message, attachments)
  - Thread/reply support
  - Scrollbar
- **Message Input**
  - Text area
  - Emoji picker
  - Attach file button
  - Send button
- **Right Sidebar**
  - Channel members list (avatars, online/offline)
  - Pinned messages
  - Shared files

---

## 4. Task Board

**Purpose:** Manage project tasks (Kanban style).

- **Board Header**
  - Project name, settings
  - “Add Task” button
- **Kanban Columns:** To-Do | In Progress | Done
  - Cards for each task
    - Title, assignee avatar, due date
    - Click to open Task Modal
- **Task Modal**
  - Full task details
  - Description, status, assignee (dropdown), due date
  - Comments section (with files)
  - Attachments

---

## 5. Profile Page

**Purpose:** Manage user profile.

- **Avatar (large)**
- Name, email, bio
- “Edit” button (opens form)
- Change password option

---

## 6. Admin Panel

**Purpose:** Manage teams/users/roles.

- **Tabs:**
  - Users (list, role dropdown, remove/ban)
  - Teams (list, edit, delete)
  - Projects (list, edit, delete)
- **Search/filter at top**

---

### Wireframing Tools Suggestions

- [Figma](https://figma.com) (professional, collaborative)
- [Excalidraw](https://excalidraw.com) (quick, hand-drawn style)
- [Miro](https://miro.com) (collaborative whiteboard)

---

## 7. Notifications Panel
**Purpose:** View recent notifications.
- **List of Notifications**
  - Each with icon, message, timestamp
  - Mark as read/unread

# Team Collab Fullstack – ASCII Wireframes

---

## 1. Login/Register

```
+--------------------------------------------+
|           TeamCollab (Logo)                |
|--------------------------------------------|
|   Email: [_____________]                   |
|   Password: [___________]                  |
|                                            |
|   [ Login ]   [ Google SSO ]               |
|                                            |
|   Forgot password?                         |
|--------------------------------------------|
|   Don't have an account? [ Register ]      |
+--------------------------------------------+
```

---

## 2. Dashboard/Main

```
+---------------------------------------------------------------+
| [Avatar] Team > Project > Channel      [Search] [🔔][Profile] |
|---------------------------------------------------------------|
| Teams/Projects/Channels | Activity Feed / Main Content        |
|-------------------------|-------------------------------------|
| - Team 1                |  Recent Activities:                 |
|   - ProjA               |  - @Jane created task "Bug Fix"     |
|     - #general          |  - #general: "Let's meet at 3pm"    |
|     - #dev              |  - @You joined #dev                 |
|   - ProjB               |                                     |
| - Team 2                |                                     |
|   ...                   |                                     |
| [+] Add                 |                                     |
+-------------------------+-------------------------------------+
```

---

## 3. Channel/Chat

```
+---------------------------------------------------------------+
| #general (Project/Team)          [Settings]                   |
|---------------------------------------------------------------|
| [User1] Hi team! [10:00]      |  Members: [A][B][C][D]        |
| [You]  Hello!   [10:01]       |  Pinned: Welcome msg          |
| [User2] Update? [10:02]       |  Files: project.pdf           |
| ...                           |                               |
|---------------------------------------------------------------|
| [😀] [Attach]  Type your message...                 [Send]     |
+---------------------------------------------------------------+
```

---

## 4. Task Board (Kanban)

```
+---------------------------------------------------------------+
| Project: MyProject                    [Add Task] [Settings]   |
|---------------------------------------------------------------|
| To Do        | In Progress      | Done                        |
|--------------|-----------------|-----------------------------|
| [ ] Task 1   | [◼] Task 3      | [✔] Task 5                  |
| [ ] Task 2   | [◼] Task 4      | [✔] Task 6                  |
| ...          | ...             | ...                         |
+---------------------------------------------------------------+
| Click task for details: assignee, due, desc, comments, files  |
+---------------------------------------------------------------+
```

---

## 5. Profile

```
+-------------------------+
|      [Avatar]           |
|  Name: Deepesh Jha      |
|  Email: ...             |
|  Bio: ...               |
|  [Edit] [Change Pass]   |
+-------------------------+
```

---

## 6. Admin Panel

```
+---------------------------------------------------------------+
| Admin Panel:  [Users] [Teams] [Projects]                      |
|---------------------------------------------------------------|
| Users:      | Teams:      | Projects:                         |
| - @Jane [admin] [remove] | - Team1 [edit] [delete]            |
| - @You  [member][promote]| - Team2 [edit] [delete]            |
| ...                      | ...                                |
+---------------------------------------------------------------+
| Search: [______]                                             |
+---------------------------------------------------------------+
```

---

**Tip:** Use these ASCII layouts as a blueprint for digital wireframes!