// @generated automatically by Diesel CLI.

diesel::table! {
    _sqlx_migrations (version) {
        version -> Nullable<BigInt>,
        description -> Text,
        installed_on -> Timestamp,
        success -> Bool,
        checksum -> Binary,
        execution_time -> BigInt,
    }
}

diesel::table! {
    library_folders (rowid) {
        rowid -> Integer,
        path -> Text,
        recursive -> Bool,
        last_scanned -> Nullable<Timestamp>,
    }
}

diesel::table! {
    library_tracks (id) {
        id -> Nullable<Integer>,
        path -> Text,
        filename -> Text,
        title -> Nullable<Text>,
        artist -> Nullable<Text>,
        album -> Nullable<Text>,
        date_added -> Nullable<Text>,
        last_played -> Nullable<Text>,
        genre -> Nullable<Text>,
        year -> Nullable<Integer>,
        track_no -> Nullable<Integer>,
        disc_no -> Nullable<Integer>,
        composer -> Nullable<Text>,
        album_artist -> Nullable<Text>,
    }
}

diesel::table! {
    library_tracks_source (id) {
        id -> Nullable<Integer>,
        track_id -> Integer,
        source_type -> Text,
        source_id -> Text,
    }
}

diesel::table! {
    playlist_tracks (id) {
        id -> Nullable<Integer>,
        track_id -> Integer,
        playlist_id -> Integer,
        name -> Text,
        path -> Text,
        added_at -> Nullable<Timestamp>,
        position -> Integer,
    }
}

diesel::table! {
    playlists (id) {
        id -> Nullable<Integer>,
        name -> Text,
        created_at -> Nullable<Timestamp>,
    }
}

diesel::table! {
    track_play_count (id_hash) {
        id_hash -> Nullable<Text>,
        last_updated -> Nullable<Timestamp>,
        last_updated_from -> Text,
        play_count -> Integer,
    }
}

diesel::joinable!(library_tracks_source -> library_tracks (track_id));
diesel::joinable!(playlist_tracks -> library_tracks (track_id));
diesel::joinable!(playlist_tracks -> playlists (playlist_id));

diesel::allow_tables_to_appear_in_same_query!(
  _sqlx_migrations,
  library_folders,
  library_tracks,
  library_tracks_source,
  playlist_tracks,
  playlists,
  track_play_count,
);
