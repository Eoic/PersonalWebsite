CC=gcc
CFLAGS=-I. -g -Wall
DEPS = reader/reader.h
OBJ = generator.o reader/reader.o 

%.o: %.c $(DEPS)
	$(CC) -c -o $@ $< $(CFLAGS)

generator: $(OBJ)
	$(CC) -o $@ $^ $(CFLAGS)
