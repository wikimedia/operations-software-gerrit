// Copyright (C) 2023 The Android Open Source Project
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package com.google.gerrit.server.account.storage.notedb;

import com.google.gerrit.server.account.Accounts;
import com.google.gerrit.server.account.externalids.storage.notedb.ExternalIdNoteDbReadStorageModule;
import com.google.gerrit.server.mail.send.MessageIdGenerator;
import com.google.gerrit.server.mail.send.MessageIdGeneratorImpl;
import com.google.inject.AbstractModule;
import com.google.inject.Singleton;

public class AccountNoteDbReadStorageModule extends AbstractModule {
  @Override
  protected void configure() {
    install(new ExternalIdNoteDbReadStorageModule());

    bind(Accounts.class).to(AccountsNoteDbImpl.class).in(Singleton.class);
    bind(MessageIdGenerator.class).to(MessageIdGeneratorImpl.class);
  }
}
