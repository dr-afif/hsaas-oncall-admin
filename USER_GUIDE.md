# HSAAS On-Call Admin Guide

Welcome to the HSAAS On-Call Roster Admin system. This tool allows you to easily manage your department's on-call schedule, personnel pool, and shift definitions.

As a Department User, you will be assigned to a specific department. When you log in, you will only see and manage data belonging to your own department.

---

## 1. Getting Started

1. **Login**: Go to the admin site and log in with your assigned email address.
2. **Dashboard Overview**: After logging in, you will see a navigation menu on the left (or at the bottom on mobile). The main sections are:
   - **Contacts**: Where you manage the doctors/staff in your department.
   - **Slots**: Where you define the layout of your roster (e.g., AM shift, PM shift, specialized duties).
   - **Roster**: Where you actually assign people to dates.

---

## 2. Managing Contacts

Before you can build a roster, you need a pool of people to assign.

1. Navigate to the **Contacts** tab.
2. Click **Add Contact** to create a new person.
   - **Full Name**: The official name.
   - **Short Name**: A clear, unique short name (e.g., "Dr. Alice"). This is the name you will typically type into the roster.
   - **Phone Number**: Their contact number. Enter it without spaces (e.g., `0123456789`). This allows the public viewer to generate clickable WhatsApp and Phone Call links.
3. **Deactivating**: If a doctor leaves the department, you can edit their profile and turn off the "Active" switch. They will be hidden from new lists but kept in the database to preserve historical rosters.

---

## 3. Setting Up Roster Slots (The Layout)

The "Slots" section defines the columns of your roster. You can set them up per month, meaning your roster structure can change from month to month if your department's needs change.

1. Navigate to the **Slots** tab.
2. Select the **Month** you are planning for using the date picker.
3. Click **Add Slot**:
   - **Key**: A short background ID for the system (e.g., `AM`, `PM`, `CHEM`).
   - **Label**: The header text that will appear on the roster (e.g., `Morning Shift`).
   - **Max People per Slot**: If your shift requires multiple people concurrently (e.g., 4 people on a Chem shift), increase this number. You will then have the option to add specific **Sub-labels** (e.g., "Blood", "Urine") so each person slot has a clear role.
   - **Effective From**: The month this layout change begins.
   - **Required**: Check this box if the system should warn you when this slot is left empty.
4. **Copy from Prev Month**: A quick way to duplicate last month's column structure so you don't have to redefine it.

---

## 4. Building the Roster

With your Contacts and Slots ready, you can now assign people to dates.

1. Navigate to the **Roster** tab.
2. Select the **Month** you are working on from the top menu.
3. **Assigning People**:
   - Click any cell in the grid to highlight it.
   - Start typing a doctor's name, or double-click to see a dropdown list of all active contacts.
   - When you press `Enter` or click away, the system will attempt to match your typed text to a Contact (using their Short Name, Full Name, or Aliases). 
   - *Note: If the cell turns red, it means the name you typed did not match any known contact. Please ensure the spelling is correct or add them via the Contacts tab.*
4. **Pasting from Excel**:
   - You can copy a block of names directly from Microsoft Excel or Google Sheets.
   - Click the starting cell on the roster and press `Ctrl+V` (or `Cmd+V`). 
   - The system will smartly paste the names across the dates and slots automatically.

---

## 5. Saving and Publishing

Changes you make to the roster are kept in your browser until you save them.

1. **Save Changes**: Click the `Save Changes` button periodically to secure your work to the database. The roster remains in "Draft" mode, meaning the public website will NOT see these changes yet.
2. **Validate**: Click this button to have the system double-check your roster. It will look for empty "Required" slots and any names that were misspelled and couldn't be linked to a real doctor.
3. **Publish**: Once the month is finalized and fully covered, click `Publish`. This makes the schedule instantly live and visible to all doctors on the public viewer application.

---

### Tips & Resources
- Use **Export JSON** on the Roster tab to download a raw data copy of the month's schedule.
- Pay attention to the **Holidays** marked in green on the roster, which may affect your coverage needs.
