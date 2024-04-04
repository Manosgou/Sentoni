![title](public/images/logo.png)

# Sentoni

_An application to manage the daily tasks of staff._

## Background Story

I bid farewell to the army and my military duties as a reserve officer cadet. Five months of training and 12 months as a first office assistant in the 21st Engineer Company are coming to an end. I would like to thank all the company personnel throughout my service, but especially the first office staff, I think we were able to become a good team and achieve an excellent working relationship. Because of that excellent working relationship from the moment I arrived in the office, in the last months of my tenure I decided to create and give them an application that would solve, automate day-to-day issues. More specifically, one of the activities of the office is managing the staff and recording their daily events. A daily time-consuming process that often became very tedious. So reaching today (05/04/2024) and after 5 months of a lot of work and many tests, the first version of the "Sentoni" application is a fact. The purpose of the application is to replace the endless excel sheets we used to use for the above tasks (hence the name Sentoni, which means bed sheet in Greek), with a more convenient and easy to use application.

## Tech

Sentoni uses a number of tools to work properly:

- [Tauri]
  - [React] - Frontend
    - [Ant-Design] - UI Components Library
  - [Rust] - Backend
    - [ormlite] - ORM
- [SQLite] - Database
- [Bun] - JavaScript Runtime
- [Vite] - Frontend build tool

The above list consists of the main tools that were involved in the development process. For more information check `package.json` for React dependencies and `cargo.toml` for Rust dependencies.

## Dev instructions

> Sentoni has been developed with Windows 32bit support in mind. An
> executable file for Windows can be found under "Releases". However,
> you can build the application from source for your architecture.

### Get started

1. Install Bun
2. Install Rust (You need to have a working rust toolchain (e.g. via [rustup](https://rustup.rs/))
3. Run `bun install`

### Commands

- `bun run tauri dev`: Start app in dev mode
- `bun run tauri build`: Build

## License

Sentoni is licensed under the MIT license. See [LICENSE](https://github.com/Manosgou/Sentoni/blob/main/LICENSE.txt) for more information.

[React]: https://react.dev/
[Tauri]: https://tauri.app/
[Rust]: https://www.rust-lang.org/
[Ant-Design]: https://ant.design/
[Bun]: https://bun.sh/
[Vite]: https://vitejs.dev/
[ormlite]: https://crates.io/crates/ormlite
[SQLite]: https://www.sqlite.org/
