# EzyDrive Rentals — Simple Functional Test Plan

## Prerequisites

- XAMPP Apache and MySQL running.
- `database/ezydrive_rentals.sql` imported into phpMyAdmin.
- Open `http://localhost/EzyDrive_Rentals/` in a browser.
- Use made-up test data, not real personal information.

| # | Action | Expected result | Actual / Pass? |
|---|---|---|---|
| 1 | Open Home / Vehicles / Booking / About from navbar | All four pages load | __________ |
| 2 | Open Vehicles page | 12 seeded vehicles display with images | __________ |
| 3 | Register account with valid information | Registration success and signed-in status | __________ |
| 4 | Log out, then log in using same credentials | Login success | __________ |
| 5 | Click Book Now on a vehicle | Booking page opens with that car selected | __________ |
| 6 | Book a 2-day rental | Booking stored; correct price is shown | __________ |
| 7 | Open Booking Details | Customer, vehicle, dates and total are shown | __________ |
| 8 | Book same vehicle on conflicting dates with another account | Booking is rejected | __________ |
| 9 | Cancel original booking | Booking status changes to Cancelled | __________ |
| 10 | Book the same dates after cancellation | Booking succeeds (if vehicle remains available) | __________ |
| 11 | Make one trusted account admin using SETUP_BACKEND.md; add a vehicle | New row appears in catalog | __________ |
| 12 | Edit that unbooked vehicle | Updated details are visible | __________ |
| 13 | Delete that never-booked vehicle | Vehicle disappears from catalog | __________ |
| 14 | Open About Us and play the video | Video plays locally (no internet needed) | __________ |
| 15 | Check site on narrow mobile viewport | Navbar toggles and cards stack | __________ |

If a test fails: record the error, check browser Developer Tools (F12) and Apache/PHP logs. Never mark a test as passed unless you actually ran it.
